'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const pdf = require('../src/lib/pdf');
const { parseJSON } = require('../src/lib/gemini');

const longText = (n, word = 'palavra ') => word.repeat(n);

test('isPdfBuffer reconhece o cabeçalho %PDF- e rejeita outros arquivos', () => {
  assert.equal(pdf.isPdfBuffer(Buffer.from('%PDF-1.7\n...')), true);
  assert.equal(pdf.isPdfBuffer(Buffer.from('<html></html>')), false);
  assert.equal(pdf.isPdfBuffer(Buffer.alloc(0)), false);
  assert.equal(pdf.isPdfBuffer('%PDF-'), false);
});

test('cleanText normaliza quebras, espaços e caracteres nulos', () => {
  assert.equal(pdf.cleanText('a\u0000b\r\n\r\n\r\n\r\nc   d\t\te'), 'ab\n\nc d e');
});

test('chunkText: texto curto vira 1 parte e cobre 100%', () => {
  const r = pdf.chunkText('Texto curto.');
  assert.equal(r.chunks.length, 1);
  assert.equal(r.truncated, false);
  assert.equal(r.coveragePercent, 100);
});

test('chunkText: quebra em fronteira de parágrafo e não perde conteúdo', () => {
  const paragraphs = Array.from({ length: 10 }, (_, i) => `Parágrafo ${i}. ${longText(40)}`);
  const text = paragraphs.join('\n\n');
  const r = pdf.chunkText(text, { size: 1000, maxChunks: 50 });
  assert.ok(r.chunks.length > 1);
  assert.ok(r.chunks.every((c) => c.length <= 1000));
  assert.equal(r.truncated, false);
  assert.equal(r.chunks.join(' ').replace(/\s+/g, ' '), text.replace(/\s+/g, ' ').trim());
});

test('chunkText: respeita o teto de partes e informa a cobertura', () => {
  const text = longText(10000); // 80 mil caracteres
  const r = pdf.chunkText(text, { size: 10000, maxChunks: 4 });
  assert.equal(r.chunks.length, 4);
  assert.equal(r.truncated, true);
  assert.ok(r.coveragePercent >= 45 && r.coveragePercent <= 55, `cobertura ${r.coveragePercent}`);
});

test('mapLimit mantém a ordem e respeita a concorrência', async () => {
  let running = 0;
  let peak = 0;
  const out = await pdf.mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
    running++;
    peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 5));
    running--;
    return n * 10;
  });
  assert.deepEqual(out, [10, 20, 30, 40, 50, 60]);
  assert.ok(peak <= 2);
});

test('flashcards: remove inválidos e duplicados e limita a quantidade', () => {
  const raw = [
    { question: 'O que é X?', answer: 'Y' },
    { question: 'o que é x?', answer: 'repetida' },
    { question: '', answer: 'sem pergunta' },
    { question: 'Sem resposta', answer: '' },
    'lixo',
    null,
    ...Array.from({ length: 30 }, (_, i) => ({ question: `Q${i}`, answer: `A${i}` })),
  ];
  const out = pdf.normalizeFlashcards(raw);
  assert.equal(out.length, 12);
  assert.deepEqual(out[0], { question: 'O que é X?', answer: 'Y' });
  assert.deepEqual(pdf.normalizeFlashcards('nada'), []);
});

const goodQ = (over = {}) => ({ question: 'Q?', options: ['a', 'b', 'c', 'd'], correctIndex: 2, explanation: 'porque c', ...over });

test('questões: descarta formato inválido', () => {
  const raw = [
    goodQ(),
    goodQ({ options: ['a', 'b', 'c'] }),
    goodQ({ options: ['a', 'a', 'c', 'd'] }),
    goodQ({ options: ['a', '', 'c', 'd'] }),
    goodQ({ correctIndex: 4 }),
    goodQ({ correctIndex: -1 }),
    goodQ({ correctIndex: 'x' }),
    goodQ({ question: '' }),
  ];
  assert.equal(pdf.normalizeQuestions(raw).length, 1);
});

test('questões: embaralhar não troca qual alternativa é a correta', () => {
  for (let seed = 0; seed < 50; seed++) {
    let s = seed + 1;
    const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const [q] = pdf.normalizeQuestions([goodQ()], { rng });
    assert.equal(q.options[q.correctIndex], 'c', `seed ${seed}`);
    assert.deepEqual([...q.options].sort(), ['a', 'b', 'c', 'd']);
  }
});

test('mapa mental: normaliza ramos e devolve null se vazio', () => {
  const out = pdf.normalizeMindMap({
    title: 'Tema',
    branches: [{ topic: 'A', points: ['1', '', '2'] }, { topic: '', points: ['x'] }, { topic: 'B' }],
  });
  assert.deepEqual(out, { title: 'Tema', branches: [{ topic: 'A', points: ['1', '2'] }, { topic: 'B', points: [] }] });
  assert.equal(pdf.normalizeMindMap({ title: 'x', branches: [] }), null);
  assert.equal(pdf.normalizeMindMap(null), null);
});

// ---------- pipeline com geradores falsos ----------

function fakeDeps({ failJson = [], failText = false } = {}) {
  const calls = { text: [], json: [] };
  return {
    calls,
    generateText: async (prompt) => {
      calls.text.push(prompt);
      if (failText) throw new Error('quota');
      return prompt.startsWith('Parte ') ? `- anotações ${calls.text.length}` : 'Resumo gerado.';
    },
    generateJSON: async (prompt, schema) => {
      calls.json.push(prompt);
      const key = prompt.includes('flashcards') ? 'flashcards' : prompt.includes('questões') ? 'questions' : 'mindMap';
      if (failJson.includes(key)) throw new Error('quota');
      if (key === 'flashcards') return [{ question: 'P?', answer: 'R' }];
      if (key === 'questions') return [goodQ()];
      return { title: 'T', branches: [{ topic: 'A', points: ['p'] }] };
    },
  };
}

test('processDocument: texto curto usa 1 parte, sem etapa de anotações', async () => {
  const deps = fakeDeps();
  const r = await pdf.processDocument(longText(200), deps);
  assert.equal(r.summary, 'Resumo gerado.');
  assert.equal(r.flashcards.length, 1);
  assert.equal(r.questions.length, 1);
  assert.equal(r.mindMap.title, 'T');
  assert.equal(r.coverage.chunks, 1);
  assert.deepEqual(r.warnings, []);
  assert.equal(deps.calls.text.filter((p) => p.startsWith('Parte ')).length, 0);
});

test('processDocument: documento longo gera anotações de TODAS as partes', async () => {
  const deps = fakeDeps();
  const text = longText(7000); // ~56 mil caracteres => 3 partes de 20 mil
  const r = await pdf.processDocument(text, deps);
  const noteCalls = deps.calls.text.filter((p) => p.startsWith('Parte '));
  assert.equal(r.coverage.chunks, noteCalls.length);
  assert.ok(r.coverage.chunks >= 3);
  assert.equal(r.coverage.truncated, false);
  // o material final é montado a partir das anotações, não do texto bruto
  const summaryPrompt = deps.calls.text.find((p) => p.startsWith('Resuma'));
  assert.ok(summaryPrompt.includes('# Parte 1') && summaryPrompt.includes('# Parte 3'));
  assert.ok(summaryPrompt.length < text.length);
});

test('processDocument: documento enorme é truncado e avisa a cobertura', async () => {
  const r = await pdf.processDocument(longText(40000), fakeDeps()); // 320 mil caracteres
  assert.equal(r.coverage.chunks, pdf.MAX_CHUNKS);
  assert.equal(r.coverage.truncated, true);
  assert.ok(r.coverage.coveragePercent < 100);
});

test('processDocument: falha parcial devolve o que deu certo com aviso', async () => {
  const r = await pdf.processDocument(longText(200), fakeDeps({ failJson: ['mindMap'] }));
  assert.equal(r.mindMap, null);
  assert.equal(r.summary, 'Resumo gerado.');
  assert.ok(r.warnings.some((w) => w.includes('mindMap')));
});

test('processDocument: falha total propaga o erro', async () => {
  const deps = fakeDeps({ failText: true, failJson: ['flashcards', 'questions', 'mindMap'] });
  await assert.rejects(() => pdf.processDocument(longText(200), deps), /quota/);
});

test('processDocument: PDF sem texto (escaneado) falha com NO_TEXT', async () => {
  await assert.rejects(() => pdf.processDocument('  \n ', fakeDeps()), (e) => e.code === 'NO_TEXT');
});

// ---------- parseJSON ----------

test('parseJSON aceita cercas, texto em volta, arrays e rejeita lixo', () => {
  assert.deepEqual(parseJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJSON('Claro! Aqui está: {"a":[1,2]} Espero ter ajudado.'), { a: [1, 2] });
  assert.deepEqual(parseJSON('texto [{"q":"x"}] fim'), [{ q: 'x' }]);
  assert.equal(parseJSON('sem json nenhum'), null);
  assert.equal(parseJSON('{quebrado'), null);
  assert.equal(parseJSON(undefined), null);
});
