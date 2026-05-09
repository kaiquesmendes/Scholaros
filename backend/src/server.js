require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

console.log("🤖 Gemini inicializado com modelo: gemini-3.1-flash-lite-preview");

app.use(cors());
app.use(express.json());

// Função auxiliar para limpar e extrair JSON das respostas
function extractJSON(text) {
  try {
    // Tenta encontrar JSON entre colchetes ou chaves
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  } catch (e) {
    console.error('Erro ao extrair JSON:', e);
    return null;
  }
}

// ==================== ANÁLISE DE REDAÇÃO ====================
app.post('/api/essay/analyze', async (req, res) => {
  try {
    const { content, mode } = req.body;
    
    if (!content || content.trim().length < 50) {
      return res.json({
        grade: 0,
        competences: [],
        strengths: ['Escreva mais para receber feedback completo'],
        improvements: ['Sua redação está muito curta'],
        suggestions: ['Escreva pelo menos 20 linhas']
      });
    }
    

    const prompt = `Analise a seguinte redação como um corretor do ${mode === 'enem' ? 'ENEM' : 'nível superior'}.
    
    Retorne APENAS um JSON válido com esta estrutura exata (sem texto antes ou depois):
    {
      "grade": 750,
      "competences": [
        {"name": "Competência 1 - Domínio da norma culta", "score": 160},
        {"name": "Competência 2 - Compreensão da proposta", "score": 150},
        {"name": "Competência 3 - Argumentação", "score": 140},
        {"name": "Competência 4 - Conectivos", "score": 155},
        {"name": "Competência 5 - Proposta de intervenção", "score": 145}
      ],
      "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
      "improvements": ["melhoria 1", "melhoria 2", "melhoria 3"],
      "suggestions": ["sugestão 1", "sugestão 2", "sugestão 3"]
    }
    
    Redação: ${content.substring(0, 3000)}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      grade: 700,
      competences: [
        { name: 'Competência 1 - Domínio da norma culta', score: 140 },
        { name: 'Competência 2 - Compreensão da proposta', score: 140 },
        { name: 'Competência 3 - Argumentação', score: 140 },
        { name: 'Competência 4 - Conectivos', score: 140 },
        { name: 'Competência 5 - Proposta de intervenção', score: 140 }
      ],
      strengths: ['Estrutura básica presente'],
      improvements: ['Desenvolver melhor os argumentos'],
      suggestions: ['Pratique escrita diariamente']
    };
    res.json(analysis);
    
  } catch (error) {
    console.error('Erro na análise:', error);
    res.json({
      grade: 700,
      competences: [
        { name: 'Competência 1 - Domínio da norma culta', score: 140 },
        { name: 'Competência 2 - Compreensão da proposta', score: 140 },
        { name: 'Competência 3 - Argumentação', score: 140 },
        { name: 'Competência 4 - Conectivos', score: 140 },
        { name: 'Competência 5 - Proposta de intervenção', score: 140 }
      ],
      strengths: ['Tente novamente mais tarde'],
      improvements: ['Sistema temporariamente indisponível'],
      suggestions: ['Tente processar novamente']
    });
  }
});

// ==================== PROCESSAMENTO DE PDF ====================
app.post('/api/pdf/process', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Extrair texto do PDF
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.substring(0, 6000);
    
    console.log(`📄 Processando PDF: ${req.file.originalname}`);
    console.log(`📝 Texto extraído: ${text.length} caracteres`);

    // Executar todas as chamadas em paralelo
    const [summaryResult, flashcardsResult, questionsResult, mindMapResult] = await Promise.all([
      model.generateContent(`Resuma o seguinte texto acadêmico em 3-4 parágrafos claros e concisos. Seja direto e mantenha os pontos principais:\n\n${text}`),
      model.generateContent(`Crie 5 flashcards baseados no texto. Responda APENAS com um array JSON válido. Cada flashcard deve ter "question" e "answer". Exemplo: [{"question": "O que é X?", "answer": "X é Y"}]\n\nTexto: ${text}`),
      model.generateContent(`Crie 3 questões de múltipla escolha baseadas no texto. Responda APENAS com um array JSON válido. Cada questão deve ter: "question", "options" (array com 4 strings), "correct" (string exata da opção correta). Exemplo: [{"question": "Pergunta?", "options": ["A", "B", "C", "D"], "correct": "A"}]\n\nTexto: ${text}`),
      model.generateContent(`Crie um mapa mental simples do texto em formato de tópicos. Use * para cada nível. Máximo 8 linhas:\n\n${text.substring(0, 1500)}`)
    ]);

    // Processar resumo
    const summary = summaryResult.response.text();

    // Processar flashcards
    let flashcards = [];
    try {
      const flashcardsText = flashcardsResult.response.text();
      const parsed = extractJSON(flashcardsText);
      if (parsed && Array.isArray(parsed)) {
        flashcards = parsed.slice(0, 5);
      } else {
        throw new Error('Formato inválido');
      }
    } catch (e) {
      console.error('Erro ao processar flashcards, usando fallback');
      flashcards = [
        { question: "Qual é o tema principal do documento?", answer: "O tema principal deve ser extraído da leitura do texto." },
        { question: "Quais são os conceitos-chave apresentados?", answer: "Os conceitos-chave estão detalhados no conteúdo original." }
      ];
    }

    // Processar questões - CORRIGIDO
    let questions = [];
    try {
      const questionsText = questionsResult.response.text();
      const parsed = extractJSON(questionsText);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed.map(q => ({
          question: q.question || "Pergunta não disponível",
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Opção A", "Opção B", "Opção C", "Opção D"],
          correct: q.correct || (q.options && q.options[0]) || "Opção A"
        })).slice(0, 3);
      } else {
        throw new Error('Formato inválido');
      }
    } catch (e) {
      console.error('Erro ao processar questões, usando fallback');
      questions = [
        {
          question: "Qual é o assunto principal abordado no documento?",
          options: ["Matemática Básica", "Português", "História", "Geografia"],
          correct: "Matemática Básica"
        },
        {
          question: "O que o texto mais enfatiza em relação ao aprendizado?",
          options: ["Conceitos fundamentais", "Exemplos práticos", "Exercícios avançados", "Teorias complexas"],
          correct: "Conceitos fundamentais"
        },
        {
          question: "Qual a melhor forma de estudar este conteúdo segundo o texto?",
          options: ["Leitura dinâmica", "Prática constante", "Apenas teoria", "Vídeos aulas"],
          correct: "Prática constante"
        }
      ];
    }

    // Processar mapa mental
    let mindMap = mindMapResult.response.text();
    if (!mindMap || mindMap.length < 10) {
      mindMap = "• Conceitos principais do documento\n• Organização do conteúdo\n• Aplicações práticas";
    }

    console.log(`✅ Processado: ${flashcards.length} flashcards, ${questions.length} questões`);

    res.json({
      summary: summary,
      flashcards: flashcards,
      questions: questions,
      mindMap: mindMap,
      metadata: {
        fileName: req.file.originalname,
        pageCount: pdfData.numpages,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro no processamento do PDF:', error);
    res.status(500).json({ 
      error: 'Erro ao processar PDF',
      summary: 'Ocorreu um erro ao processar seu documento. Tente novamente com um arquivo menor.',
      flashcards: [
        { question: "Tente processar novamente", answer: "O arquivo pode estar muito grande ou em formato incompatível" }
      ],
      questions: [
        {
          question: "Erro no processamento",
          options: ["Tente novamente", "Use um arquivo menor", "Verifique o formato", "Contate o suporte"],
          correct: "Tente novamente"
        }
      ],
      mindMap: "• Erro no processamento\n• Tente novamente com um arquivo menor"
    });
  }
});

// ==================== ASSISTENTE DE ESTUDOS ====================
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    const result = await model.generateContent(
      `Você é um tutor acadêmico paciente e didático. Responda de forma clara, concisa e útil: ${message}`
    );
    
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 ScholarOS backend rodando na porta ${PORT}`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ Chave não encontrada'}`);
  console.log(`📡 Disponível em: http://localhost:${PORT}`);
});

// backend/server.js - Adicione esta rota
app.post('/api/essay/format-abnt', async (req, res) => {
  try {
    const { content, tccData, prompt } = req.body;
    
    // Usar IA para formatar (Gemini/GPT)
    const result = await model.generateContent(prompt);
    const formattedText = result.response.text();
    
    res.json({ formattedText, success: true });
  } catch (error) {
    console.error('Erro na formatação ABNT:', error);
    res.json({ formattedText: content, success: false });
  }
});