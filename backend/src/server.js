require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// ==================== FIREBASE ADMIN (verificação de token) ====================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Em algumas plataformas (Render, Vercel) a env var chega com \n escapado
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

// Middleware: exige um ID token válido do Firebase Auth no header Authorization
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação ausente.' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // disponibiliza uid/email para as rotas, se precisar
    next();
  } catch (error) {
    console.error('Falha na verificação do token:', error.message);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

console.log("🤖 Gemini inicializado com modelo: gemini-3.1-flash-lite-preview");

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limit: protege as rotas de IA (custosas) de abuso, mesmo autenticadas
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // até 30 requisições de IA por usuário/IP a cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições de IA em pouco tempo. Tente novamente em alguns minutos.' },
});

// Função auxiliar para limpar e extrair JSON das respostas
function extractJSON(text) {
  try {
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
app.post('/api/essay/analyze', requireAuth, aiLimiter, async (req, res) => {
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

    const prompt = `Analise a seguinte redação como um corretor do ${mode === 'enem' ? 'ENEM' : mode === 'faculdade' ? 'nível superior' : 'TCC'}.
    
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
app.post('/api/pdf/process', requireAuth, aiLimiter, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.substring(0, 6000);
    
    console.log(`📄 Processando PDF: ${req.file.originalname}`);
    console.log(`📝 Texto extraído: ${text.length} caracteres`);

    const [summaryResult, flashcardsResult, questionsResult, mindMapResult] = await Promise.all([
      model.generateContent(`Resuma o seguinte texto acadêmico em 3-4 parágrafos claros e concisos:\n\n${text}`),
      model.generateContent(`Crie 5 flashcards baseados no texto. Responda APENAS com um array JSON válido. Exemplo: [{"question": "O que é X?", "answer": "X é Y"}]\n\nTexto: ${text}`),
      model.generateContent(`Crie 3 questões de múltipla escolha. Responda APENAS com um array JSON. Cada questão deve ter: "question", "options" (4 strings), "correct".\n\nTexto: ${text}`),
      model.generateContent(`Crie um mapa mental simples do texto em formato de tópicos. Máximo 8 linhas:\n\n${text.substring(0, 1500)}`)
    ]);

    const summary = summaryResult.response.text();

    let flashcards = [];
    try {
      const flashcardsText = flashcardsResult.response.text();
      const parsed = extractJSON(flashcardsText);
      if (parsed && Array.isArray(parsed)) {
        flashcards = parsed.slice(0, 5);
      }
    } catch (e) {
      flashcards = [
        { question: "Qual é o tema principal do documento?", answer: "Extraia da leitura do texto." }
      ];
    }

    let questions = [];
    try {
      const questionsText = questionsResult.response.text();
      const parsed = extractJSON(questionsText);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed.map(q => ({
          question: q.question || "Pergunta não disponível",
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["A", "B", "C", "D"],
          correct: q.correct || (q.options && q.options[0]) || "A"
        })).slice(0, 3);
      }
    } catch (e) {
      questions = [
        {
          question: "Qual é o assunto principal abordado?",
          options: ["Matemática", "Português", "História", "Geografia"],
          correct: "Matemática"
        }
      ];
    }

    let mindMap = mindMapResult.response.text();
    if (!mindMap || mindMap.length < 10) {
      mindMap = "• Conceitos principais do documento\n• Organização do conteúdo";
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
      summary: 'Erro ao processar. Tente novamente.',
      flashcards: [],
      questions: [],
      mindMap: 'Erro no processamento'
    });
  }
});

// ==================== FORMATAÇÃO ABNT (CORRIGIDO) ====================
app.post('/api/essay/format-abnt', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { content, mode, tccConfig, prompt } = req.body;
    
    // Verificar se content existe
    if (!content) {
      return res.status(400).json({ 
        formattedText: "Erro: Nenhum conteúdo para formatar.",
        success: false 
      });
    }

    console.log(`🎨 Formatando ${mode} com IA...`);
    console.log(`📝 Tamanho do texto: ${content.length} caracteres`);

    // Usar o prompt específico ou criar um genérico
    let finalPrompt = prompt;
    if (!finalPrompt) {
      if (mode === 'enem') {
        finalPrompt = `Formate o texto como uma REDAÇÃO ENEM seguindo:
- Introdução com tese
- 2 parágrafos de desenvolvimento
- Conclusão com proposta de intervenção
- Linguagem formal

Texto: ${content.substring(0, 8000)}`;
      } else if (mode === 'faculdade') {
        finalPrompt = `Formate o texto como ARTIGO CIENTÍFICO:
- Título, Autor, Resumo, Palavras-chave
- Introdução, Metodologia, Resultados, Conclusão
- Referências

Texto: ${content.substring(0, 8000)}`;
      } else {
        finalPrompt = `Formate o texto como TCC seguindo normas ABNT:
Título: ${tccConfig?.titulo || 'Título'}
Autor: ${tccConfig?.autor || 'Autor'}
Orientador: ${tccConfig?.orientador || 'Orientador'}
Instituição: ${tccConfig?.instituicao || 'Instituição'}

Estrutura obrigatória:
- Capa, Folha de rosto, Resumo, Abstract, Sumário
- Introdução, Desenvolvimento, Conclusão
- Referências ABNT

Texto: ${content.substring(0, 8000)}`;
      }
    }

    const result = await model.generateContent(finalPrompt);
    const formattedText = result.response.text();
    
    console.log("✅ Formatação concluída com sucesso!");
    
    res.json({ 
      formattedText: formattedText, 
      success: true 
    });
    
  } catch (error) {
    console.error('Erro na formatação ABNT:', error);
    // Enviar o texto original de volta em caso de erro
    res.json({ 
      formattedText: req.body?.content || "Erro ao formatar. Tente novamente.",
      success: false,
      error: error.message
    });
  }
});

// ==================== ASSISTENTE DE ESTUDOS ====================
app.post('/api/chat', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    
    const result = await model.generateContent(
      `Você é um tutor acadêmico paciente e didático. Responda de forma clara: ${message}`
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

// ==================== ROTA RAIZ ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'ScholarOS API está rodando!',
    endpoints: ['/api/essay/analyze', '/api/pdf/process', '/api/essay/format-abnt', '/api/chat']
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 ScholarOS backend rodando na porta ${PORT}`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ Chave não encontrada'}`);
  console.log(`📡 Disponível em: http://localhost:${PORT}`);
});