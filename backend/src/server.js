require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');

const app = express();

const gemini = require('./lib/gemini');
const essay = require('./lib/essay');
const pdfLib = require('./lib/pdf');
const chatLib = require('./lib/chat');

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
});

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

console.log(`🤖 Gemini configurado com o modelo: ${gemini.MODEL_NAME}`);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '400kb' }));

// Rate limit: protege as rotas de IA (custosas) de abuso, mesmo autenticadas
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // até 30 requisições de IA por usuário/IP a cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições de IA em pouco tempo. Tente novamente em alguns minutos.' },
});

// Resposta padrão para falhas da IA: 429 quando a cota do Gemini estourou, 502 nos demais casos.
function sendAIError(res, error, message) {
  if (error && error.status === 429) {
    return res.status(429).json({ error: 'A IA está com muitas requisições agora. Tente novamente em instantes.' });
  }
  return res.status(502).json({ error: message });
}

// ==================== ANÁLISE DE REDAÇÃO ====================
app.post('/api/essay/analyze', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { content, mode: rawMode, professorMode, strictABNT } = req.body || {};

    const mode = essay.resolveMode(rawMode);
    if (!mode) {
      return res.status(400).json({ error: 'Modo inválido. Use enem, faculdade ou tcc.' });
    }
    if (typeof content !== 'string' || content.trim().length < 50) {
      return res.status(400).json({ error: 'Texto muito curto para análise (mínimo de 50 caracteres).' });
    }

    const text = content.trim();
    const truncated = text.length > essay.MAX_ANALYZE_CHARS;
    const analyzed = truncated ? text.slice(0, essay.MAX_ANALYZE_CHARS) : text;

    const flags = { mode, professorMode: professorMode === true, strictABNT: strictABNT === true };
    const raw = await gemini.generateJSON(essay.buildAnalysisPrompt(analyzed), essay.analysisSchema(), {
      systemInstruction: essay.buildAnalysisSystemInstruction(flags),
    });

    const analysis = essay.normalizeAnalysis(raw, { mode, content: analyzed, professorMode: flags.professorMode });
    if (!analysis) {
      return res.status(502).json({ error: 'A IA devolveu uma resposta inválida. Tente novamente.' });
    }

    res.json({ ...analysis, meta: { mode, truncated, analyzedChars: analyzed.length } });
  } catch (error) {
    console.error('Erro na análise:', error);
    sendAIError(res, error, 'Não foi possível analisar a redação agora. Tente novamente em instantes.');
  }
});

// ==================== FORMATAÇÃO ABNT ====================
app.post('/api/essay/format-abnt', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { content, mode: rawMode, tccConfig, strictABNT, humanizerMode, expansionMode, formatterMode } = req.body || {};

    const mode = essay.resolveMode(rawMode);
    if (!mode) {
      return res.status(400).json({ error: 'Modo inválido. Use enem, faculdade ou tcc.' });
    }
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Nenhum conteúdo para formatar.' });
    }
    // Não truncamos em silêncio: o resultado substitui o texto do aluno no editor.
    if (content.length > essay.MAX_FORMAT_CHARS) {
      return res.status(413).json({
        error: `Texto grande demais para a formatação automática (máximo de ${essay.MAX_FORMAT_CHARS} caracteres). Formate por partes.`,
      });
    }

    const prompt = essay.buildFormatPrompt({
      content: content.trim(),
      mode,
      tccConfig,
      strictABNT: strictABNT === true,
      humanizerMode: humanizerMode === true,
      expansionMode: expansionMode === true,
      formatterMode: formatterMode === true,
    });

    const raw = await gemini.generateText(prompt, {
      systemInstruction: essay.buildFormatSystemInstruction(),
      maxOutputTokens: 8192,
    });
    const formattedText = essay.stripCodeFence(raw);
    if (!formattedText) {
      return res.status(502).json({ error: 'A IA devolveu um texto vazio. Tente novamente.' });
    }

    res.json({ formattedText, success: true });
  } catch (error) {
    console.error('Erro na formatação ABNT:', error);
    sendAIError(res, error, 'Não foi possível formatar o texto agora. Tente novamente em instantes.');
  }
});

// ==================== PROCESSAMENTO DE PDF ====================
// Envolve o multer para devolver erros legíveis (arquivo grande demais, tipo errado).
function receivePdf(req, res, next) {
  upload.single('pdf')(req, res, (error) => {
    if (error && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `PDF grande demais (máximo de ${MAX_PDF_BYTES / 1024 / 1024} MB).` });
    }
    if (error) {
      return res.status(400).json({ error: 'Não foi possível receber o arquivo.' });
    }
    next();
  });
}

app.post('/api/pdf/process', requireAuth, aiLimiter, receivePdf, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Envie um arquivo PDF.' });
    }
    if (!pdfLib.isPdfBuffer(req.file.buffer)) {
      return res.status(400).json({ error: 'O arquivo enviado não é um PDF válido.' });
    }

    let parsed;
    try {
      parsed = await pdfParse(req.file.buffer);
    } catch (parseError) {
      console.error('Falha ao ler o PDF:', parseError.message);
      return res.status(422).json({ error: 'Não foi possível ler este PDF. Ele pode estar corrompido ou protegido.' });
    }

    let result;
    try {
      result = await pdfLib.processDocument(parsed.text, {
        generateText: gemini.generateText,
        generateJSON: gemini.generateJSON,
      });
    } catch (error) {
      if (error.code === 'NO_TEXT') {
        return res.status(422).json({
          error: 'Este PDF não tem texto selecionável (provavelmente é um documento escaneado). Use um PDF com texto.',
        });
      }
      throw error;
    }

    // multer entrega o nome como latin1; converte para UTF-8 para preservar acentos.
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    console.log(`📄 PDF "${fileName}": ${result.coverage.chars} caracteres em ${result.coverage.chunks} parte(s)`);

    res.json({
      summary: result.summary,
      flashcards: result.flashcards,
      questions: result.questions,
      mindMap: result.mindMap,
      warnings: result.warnings,
      metadata: {
        fileName,
        pageCount: parsed.numpages,
        processedAt: new Date().toISOString(),
        ...result.coverage,
      },
    });
  } catch (error) {
    console.error('Erro no processamento do PDF:', error);
    sendAIError(res, error, 'Não foi possível processar o PDF agora. Tente novamente em instantes.');
  }
});

// ==================== TUTOR DE ESTUDOS ====================
// Aceita { messages: [{ role, content }], context? } ou, por compatibilidade, { message }.
app.post('/api/chat', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { messages, message, context } = req.body || {};
    const conversation = chatLib.normalizeConversation(
      Array.isArray(messages) ? messages : [{ role: 'user', content: message }]
    );
    if (!conversation) {
      return res.status(400).json({ error: 'Envie uma mensagem para o tutor.' });
    }

    const reply = await gemini.chatReply({
      systemInstruction: chatLib.buildTutorSystemInstruction(context),
      history: conversation.history,
      message: conversation.message,
    });

    res.json({ response: reply });
  } catch (error) {
    console.error('Erro no chat:', error);
    sendAIError(res, error, 'Não foi possível falar com o tutor agora. Tente novamente em instantes.');
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
    endpoints: ['/api/essay/analyze', '/api/essay/format-abnt', '/api/pdf/process', '/api/chat']
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 ScholarOS backend rodando na porta ${PORT}`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ Chave não encontrada'}`);
  console.log(`📡 Disponível em: http://localhost:${PORT}`);
});