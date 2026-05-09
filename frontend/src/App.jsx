import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaBook, FaFileAlt, FaFilePdf, FaMagic, FaSpinner, 
  FaCheck, FaCopy, FaUndo, FaRobot, FaChartLine, 
  FaLightbulb, FaQuoteRight, FaListOl, FaSave, FaEye, FaDownload 
} from 'react-icons/fa';

// Firebase
import { auth, onAuthStateChanged, loginUser, registerUser, logoutUser, resetPassword } from './config/firebase';

// Componentes
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PDFUploader from './components/PDFUploader';
import Profile from './pages/Profile';

// ========== COMPONENTE DE LOADING ==========
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white mx-auto mb-6"></div>
      <h2 className="text-2xl font-bold text-white mb-2">ScholarOS</h2>
      <p className="text-white/80">Carregando sua experiência acadêmica...</p>
    </div>
  </div>
);

// ========== DASHBOARD COMPLETO ==========
const Dashboard = ({ user }) => {
  const [stats] = useState([
    { label: 'Sequência', value: '14 dias', change: '+2 hoje', icon: '🔥', color: 'bg-orange-500' },
    { label: 'Horas Estudadas', value: '347h', change: '+12.5h', icon: '⏱️', color: 'bg-blue-500' },
    { label: 'Metas Concluídas', value: '42/60', change: '+8%', icon: '🎯', color: 'bg-green-500' },
    { label: 'Retenção Média', value: '85%', change: '+5%', icon: '🧠', color: 'bg-purple-500' },
  ]);

  const subjects = [
    { name: 'Matemática', progress: 78, color: '#8b5cf6', hours: 42 },
    { name: 'Português', progress: 82, color: '#ec4899', hours: 38 },
    { name: 'Redação', progress: 75, color: '#06b6d4', hours: 35 },
    { name: 'Física', progress: 62, color: '#f59e0b', hours: 28 },
    { name: 'Química', progress: 68, color: '#10b981', hours: 31 },
  ];

  const recentActivities = [
    { id: 1, title: 'Redação ENEM analisada', score: 820, date: 'Hoje, 14:30', icon: '✍️' },
    { id: 2, title: 'PDF "Matemática Básica" processado', pages: 45, date: 'Ontem, 10:15', icon: '📄' },
    { id: 3, title: 'Desafio semanal concluído', reward: '200 XP', date: 'Ontem, 18:00', icon: '🏆' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        <main className="p-6">
          {/* Welcome Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Olá, {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Estudante'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Hoje é um ótimo dia para aprender algo novo. Vamos começar?
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} bg-opacity-20 flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                  <span className="text-sm text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts and Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Subjects Progress */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                📊 Progresso por Matéria
              </h3>
              <div className="space-y-5">
                {subjects.map((subject, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }}></div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{subject.name}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-sm text-gray-500">{subject.hours}h</span>
                        <span className="text-sm font-semibold" style={{ color: subject.color }}>{subject.progress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full rounded-full transition-all"
                        style={{ backgroundColor: subject.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                📝 Atividades Recentes
              </h3>
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">{activity.title}</p>
                      {activity.score && <p className="text-sm text-green-600">Nota: {activity.score}</p>}
                      {activity.pages && <p className="text-sm text-blue-600">{activity.pages} páginas</p>}
                      {activity.reward && <p className="text-sm text-yellow-600">{activity.reward}</p>}
                      <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                    </div>
                    <div className="text-gray-400">→</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Radar de Aprovação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-lg"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">🎯 Radar de Aprovação</h3>
                <p className="text-white/80">Seu nível de preparação para o ENEM</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-1">78%</div>
                <p className="text-white/80 text-sm">Nível de Preparação</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Matemática', value: 78 },
                { name: 'Redação', value: 72 },
                { name: 'Ciências', value: 65 },
                { name: 'Humanas', value: 82 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm text-white mb-1">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/20 flex justify-between text-white/80 text-sm">
              <span>📊 Matérias críticas: Física e Química</span>
              <span>🎯 Meta da semana: +15% em Ciências</span>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// ========== EDITOR ACADÊMICO COMPLETO - VERSÃO DEFINITIVA ==========
const EssayEditor = ({ user }) => {
  const [essay, setEssay] = useState('');
  const [originalEssay, setOriginalEssay] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [mode, setMode] = useState('enem');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [theme, setTheme] = useState('light');
  
  // Configuração do TCC
  const [tccConfig, setTccConfig] = useState({
    titulo: '',
    subtitulo: '',
    autor: '',
    orientador: '',
    coorientador: '',
    instituicao: '',
    curso: '',
    cidade: '',
    ano: new Date().getFullYear(),
  });

  const cfg = {
    enem: { 
      label: 'ENEM', 
      icon: '🎯', 
      bgIcon: '✍️',
      color: 'from-purple-600 to-purple-700',
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      minWords: 50, 
      gradeSuffix: '/1000', 
      description: 'Correção estilo ENEM - Redação Dissertativa-Argumentativa',
      formatPrompt: `Formate o texto como uma REDAÇÃO ENEM nota 1000 seguindo:
- Título chamativo (opcional)
- Introdução com tese clara (4-5 linhas)
- 2 parágrafos de desenvolvimento com argumentos e exemplos (6-8 linhas cada)
- Conclusão com proposta de intervenção completa (agente, ação, meio, efeito)
- Linguagem formal e impessoal
- Conectivos adequados (portanto, ademais, contudo, etc)
- Máximo 30 linhas no total`
    },
    faculdade: { 
      label: 'FACULDADE', 
      icon: '🎓', 
      bgIcon: '📚',
      color: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      minWords: 200, 
      gradeSuffix: '%', 
      description: 'Formato ABNT para Artigos e Trabalhos Acadêmicos',
      formatPrompt: `Formate o texto como um ARTIGO CIENTÍFICO seguindo normas ABNT:
- Título em negrito, centralizado
- Nome do autor abaixo
- Resumo em português (até 250 palavras)
- Palavras-chave (3 a 5)
- Abstract em inglês
- Keywords
- 1 INTRODUÇÃO (contexto, problema, objetivos)
- 2 REFERENCIAL TEÓRICO
- 3 METODOLOGIA
- 4 RESULTADOS E DISCUSSÃO
- 5 CONSIDERAÇÕES FINAIS
- REFERÊNCIAS no formato ABNT NBR 6023
- Citações diretas com aspas e página
- Fonte Times New Roman 12, espaçamento 1,5`
    },
    tcc: { 
      label: 'TCC', 
      icon: '🏆', 
      bgIcon: '📖',
      color: 'from-green-600 to-green-700',
      bgGradient: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      minWords: 500, 
      gradeSuffix: '%', 
      description: 'Formatação ABNT completa para Trabalho de Conclusão de Curso',
      formatPrompt: `Formate o texto como um TCC completo seguindo rigorosamente as normas ABNT (NBR 14724, 10520, 6023, 6024, 6027, 6028):

ESTRUTURA OBRIGATÓRIA:

PRÉ-TEXTUAIS:
- CAPA (instituição, curso, título, autor, local, ano)
- FOLHA DE ROSTO (com orientador)
- RESUMO em português (250-500 palavras, 3-5 palavras-chave)
- ABSTRACT em inglês (250-500 palavras, 3-5 keywords)
- SUMÁRIO (com numeração progressiva)

TEXTUAIS:
1 INTRODUÇÃO
   1.1 Contextualização
   1.2 Problema de pesquisa
   1.3 Questão de pesquisa
   1.4 Objetivos (geral e específicos)
   1.5 Justificativa
   1.6 Estrutura do trabalho

2 REFERENCIAL TEÓRICO
   2.1 Fundamentação conceitual
   2.2 Revisão sistemática da literatura
   2.3 Estado da arte
   2.4 Lacunas identificadas

3 METODOLOGIA
   3.1 Delineamento da pesquisa
   3.2 Classificação da pesquisa
   3.3 Universo e amostra
   3.4 Instrumentos de coleta
   3.5 Procedimentos de coleta
   3.6 Análise dos dados

4 RESULTADOS
   4.1 Caracterização da amostra
   4.2 Análise descritiva
   4.3 Análise inferencial
   4.4 Testes estatísticos

5 DISCUSSÃO
   5.1 Interpretação dos resultados
   5.2 Comparação com estudos anteriores
   5.3 Implicações teóricas e práticas
   5.4 Limitações do estudo

6 CONCLUSÃO
   6.1 Síntese dos achados
   6.2 Contribuições do estudo
   6.3 Limitações da pesquisa
   6.4 Recomendações para trabalhos futuros

PÓS-TEXTUAIS:
- REFERÊNCIAS (ABNT NBR 6023 - livros, artigos, sites, teses)
- APÊNDICES (opcional)
- ANEXOS (opcional)

FORMATAÇÃO:
- Fonte: Times New Roman ou Arial, tamanho 12
- Títulos de seção: tamanho 12, negrito, caixa alta ou baixa conforme NBR 6024
- Espaçamento entre linhas: 1,5
- Parágrafos: recuo de 1,25 cm (primeira linha)
- Margens: superior e esquerda 3cm, inferior e direita 2cm
- Alinhamento: justificado
- Citações diretas curtas (até 3 linhas): entre aspas, incorporadas ao parágrafo
- Citações diretas longas (+3 linhas): bloco recuado 4cm, fonte 10, espaço simples
- Notas de rodapé: quando necessário
- Numeração de páginas: a partir da introdução

Dados do Trabalho:
Título: ${tccConfig.titulo || '[TÍTULO DO TCC]'}
Subtítulo: ${tccConfig.subtitulo || ''}
Autor: ${tccConfig.autor || '[NOME DO AUTOR]'}
Orientador: ${tccConfig.orientador || '[NOME DO ORIENTADOR]'}
Coorientador: ${tccConfig.coorientador || ''}
Instituição: ${tccConfig.instituicao || '[NOME DA INSTITUIÇÃO]'}
Curso: ${tccConfig.curso || '[NOME DO CURSO]'}
Cidade: ${tccConfig.cidade || '[CIDADE]'}
Ano: ${tccConfig.ano}

TEXTO ORIGINAL A SER ESTRUTURADO:
${essay}

IMPORTANTE: Mantenha todo o conteúdo original, apenas reestruture e formate conforme as normas ABNT. Adicione os elementos que faltarem.`
    },
  };

  useEffect(() => {
    const words = essay.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    setCharCount(essay.length);
  }, [essay]);

  const templates = {
    enem: `🎯 REDAÇÃO ENEM - MODELO NOTA 1000

[Introdução - 4 a 5 linhas]
A discussão sobre [TEMA] é de extrema relevância no contexto brasileiro contemporâneo. Historicamente, observa-se que [contextualização histórica]. Diante desse cenário, é fundamental analisar [problema central], bem como propor soluções efetivas para [questão abordada].

[Desenvolvimento 1 - 6 a 8 linhas]
Em primeiro lugar, é importante destacar que [argumento 1]. Segundo [autor], "[citação relevante]" (ANO, p. X). Isso evidencia que [conexão com o tema]. Ademais, dados do [fonte confiável] apontam que [estatística ou dado concreto], o que reforça a necessidade de [ação específica].

[Desenvolvimento 2 - 6 a 8 linhas]
Além disso, outro aspecto fundamental reside em [argumento 2]. Conforme [filósofo/teórico], "[citação pertinente]" (ANO, p. Y). Dessa forma, percebe-se que [desdobramento do argumento]. Nesse sentido, [exemplo prático ou estudo de caso] demonstra como [relação com a tese].

[Conclusão - 5 a 6 linhas]
Portanto, faz-se necessária uma intervenção estatal e social para mitigar [problema central]. O governo, em parceria com [agentes envolvidos], deve [ação específica] por meio de [meio de implementação]. Espera-se que, com tais medidas, [resultado esperado], contribuindo para uma sociedade mais justa e igualitária.`,

    faculdade: `🎓 TRABALHO ACADÊMICO - ESTRUTURA CIENTÍFICA

TÍTULO DO TRABALHO (centralizado, negrito, fonte 12)

Nome do Autor
Instituição

RESUMO
[Escreva um resumo de 150-250 palavras apresentando o tema, objetivos, metodologia, resultados e conclusões do trabalho.]

Palavras-chave: palavra1; palavra2; palavra3.

ABSTRACT
[Write an abstract in English with the same structure as the Portuguese version.]

Keywords: keyword1; keyword2; keyword3.

1 INTRODUÇÃO
1.1 Contextualização do tema
1.2 Problema de pesquisa
1.3 Objetivos (geral e específicos)
1.4 Justificativa

2 REFERENCIAL TEÓRICO
2.1 [Conceito fundamental 1]
2.2 [Conceito fundamental 2]
2.3 [Conceito fundamental 3]

3 METODOLOGIA
3.1 Tipo de pesquisa
3.2 Coleta de dados
3.3 Análise dos dados

4 RESULTADOS E DISCUSSÃO
4.1 Apresentação dos resultados
4.2 Análise e interpretação
4.3 Comparação com a literatura

5 CONSIDERAÇÕES FINAIS
5.1 Síntese dos achados
5.2 Limitações do estudo
5.3 Sugestões para pesquisas futuras

REFERÊNCIAS
SOBRENOME, Nome. Título da obra. Edição. Local: Editora, Ano.`,

    tcc: `🏆 TRABALHO DE CONCLUSÃO DE CURSO - MODELO ABNT

[INSIRA SEUS DADOS NOS CAMPOS ABAIXO E CLIQUE EM "FORMATAÇÃO INTELIGENTE"]

Dados necessários:
• Título do TCC
• Nome do autor
• Nome do orientador
• Instituição
• Curso
• Cidade e ano

Após preencher os dados no botão "⚙️ Configurar TCC", clique em "✨ Formatação Inteligente ABNT" para gerar o TCC completo formatado.`
  };

  const insertTemplate = () => {
    if (essay.trim() && !window.confirm("Inserir template substituirá o conteúdo atual. Continuar?")) return;
    setEssay(templates[mode]);
    setOriginalEssay('');
    setFeedback(null);
    toast.success(`📋 Template ${cfg[mode].label} inserido!`);
  };

  const clearEssay = () => {
    if (essay.trim() && !window.confirm("Limpar todo o texto?")) return;
    setEssay('');
    setOriginalEssay('');
    setFeedback(null);
    toast.success('✨ Texto limpo!');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(essay);
    setShowCopied(true);
    toast.success('📋 Copiado para área de transferência!');
    setTimeout(() => setShowCopied(false), 2000);
  };

  const undoFormat = () => {
    if (originalEssay) {
      setEssay(originalEssay);
      setOriginalEssay('');
      toast.success('↩️ Formatação desfeita!');
    } else {
      toast.error('❌ Nada para desfazer');
    }
  };

  const formatWithAI = async () => {
    if (!essay.trim()) {
      toast.error(`📝 Cole ou escreva seu ${cfg[mode].label} primeiro!`);
      return;
    }

    let minWords = mode === 'enem' ? 50 : mode === 'faculdade' ? 200 : 500;
    if (wordCount < minWords) {
      toast.error(`⚠️ Mínimo de ${minWords} palavras para formatação (atual: ${wordCount})`);
      return;
    }

    setFormatting(true);
    setOriginalEssay(essay);
    toast.loading(`🤖 IA formatando seu ${cfg[mode].label}...`, { id: 'format' });

    try {
      const response = await axios.post('https://scholaros-5ncu.onrender.com/api/essay/format-abnt', {
        content: essay,
        mode: mode,
        tccConfig: tccConfig,
        prompt: cfg[mode].formatPrompt
      });

      setEssay(response.data.formattedText || response.data.content);
      toast.success(`✅ ${cfg[mode].label} formatado com sucesso!`, { id: 'format' });
    } catch (error) {
      console.error('Erro:', error);
      
      let formatted = '';
      if (mode === 'tcc') {
        formatted = `UNIVERSIDADE ${tccConfig.instituicao?.toUpperCase() || 'INSTITUIÇÃO'}\n`;
        formatted += `${tccConfig.curso?.toUpperCase() || 'CURSO'}\n\n`;
        formatted += '='.repeat(60) + '\n\n';
        formatted += `${tccConfig.titulo?.toUpperCase() || 'TÍTULO DO TCC'}\n\n`;
        formatted += `${tccConfig.autor?.toUpperCase() || 'AUTOR'}\n\n`;
        formatted += `${tccConfig.orientador ? `Orientador: ${tccConfig.orientador}\n\n` : ''}`;
        formatted += `${tccConfig.cidade || 'CIDADE'}, ${tccConfig.ano}\n`;
        formatted += '='.repeat(60) + '\n\n';
        formatted += 'RESUMO\n\n';
        formatted += essay.substring(0, 500) + '...\n\n';
        formatted += 'Palavras-chave: trabalho acadêmico, pesquisa.\n\n';
        formatted += 'ABSTRACT\n\n';
        formatted += 'Keywords: academic work, research.\n\n';
        formatted += 'SUMÁRIO\n\n';
        formatted += '1 INTRODUÇÃO ..................................... 3\n';
        formatted += '2 DESENVOLVIMENTO ............................... 4\n';
        formatted += '3 CONCLUSÃO ..................................... 5\n';
        formatted += 'REFERÊNCIAS .................................... 6\n\n';
        formatted += '1 INTRODUÇÃO\n\n';
        formatted += essay + '\n\n';
        formatted += 'REFERÊNCIAS\n\n';
        formatted += 'SOBRENOME, Nome. Título da obra. Edição. Local: Editora, Ano.\n';
      } else {
        formatted = essay;
      }
      
      setEssay(formatted);
      toast.warning('⚠️ IA indisponível. Usando formatação local básica.', { id: 'format' });
    } finally {
      setFormatting(false);
    }
  };

  const analyzeEssay = async () => {
    if (!essay.trim()) {
      toast.error(`📝 Escreva seu ${cfg[mode].label} primeiro!`);
      return;
    }
    if (wordCount < cfg[mode].minWords) {
      toast.error(`⚠️ Mínimo ${cfg[mode].minWords} palavras (atual: ${wordCount})`);
      return;
    }

    setAnalyzing(true);
    toast.loading(`🤖 IA analisando seu ${cfg[mode].label}...`, { id: 'analyzing' });

    try {
      const response = await axios.post('https://scholaros-5ncu.onrender.com/api/essay/format-abnt', {
        content: essay,
        mode: mode
      });
      setFeedback(response.data);
      toast.success(`✅ Nota: ${response.data.grade}${cfg[mode].gradeSuffix}`, { id: 'analyzing' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro na análise. Usando simulação.', { id: 'analyzing' });
      
      const mockFeedback = {
        grade: mode === 'enem' ? 780 : mode === 'faculdade' ? 82 : 85,
        competences: mode === 'enem' 
          ? [
              { name: 'Competência 1 - Domínio da norma culta', score: 160 },
              { name: 'Competência 2 - Compreensão da proposta', score: 155 },
              { name: 'Competência 3 - Argumentação', score: 150 },
              { name: 'Competência 4 - Conectivos', score: 160 },
              { name: 'Competência 5 - Proposta de intervenção', score: 155 }
            ]
          : [
              { name: 'Clareza e objetividade', score: 85 },
              { name: 'Fundamentação teórica', score: 82 },
              { name: 'Rigor metodológico', score: 80 },
              { name: 'Qualidade da análise', score: 83 },
              { name: 'Contribuição científica', score: 82 }
            ],
        strengths: ['Excelente estrutura textual', 'Argumentos coerentes', 'Boa fundamentação'],
        improvements: ['Aprofundar a análise', 'Melhorar a conclusão', 'Revisar referências'],
        suggestions: ['Pratique revisão constante', 'Leia mais referências', 'Busque feedback externo']
      };
      setFeedback(mockFeedback);
    } finally {
      setAnalyzing(false);
    }
  };

  const exportToPDF = () => {
    if (!essay.trim()) {
      toast.error("📄 Sem conteúdo para exportar");
      return;
    }
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>ScholarOS - ${cfg[mode].label}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; margin: 2.5cm; font-size: 12pt; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
  .title { font-size: 18pt; font-weight: bold; color: #2d2d2d; }
  .subtitle { font-size: 14pt; margin-top: 5px; color: #555; }
  .meta { font-size: 10pt; color: #666; margin-top: 8px; }
  pre { white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
  .footer { text-align: center; font-size: 9pt; color: #888; margin-top: 40px; padding-top: 12px; border-top: 1px solid #ccc; }
  h1, h2, h3 { color: #2d2d2d; margin-top: 20px; }
</style></head>
<body>
<div class="header">
  <div class="title">ScholarOS — ${cfg[mode].label}</div>
  <div class="subtitle">Plataforma Acadêmica Inteligente</div>
  <div class="meta">${wordCount} palavras | ${charCount} caracteres | ${new Date().toLocaleDateString('pt-BR')}</div>
</div>
<pre>${essay.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="footer">Documento gerado pelo ScholarOS - Sistema Operacional Acadêmico</div>
</body></html>`);
    win.document.close();
    win.print();
    toast.success("📄 PDF enviado para impressão!");
  };

  const ProgressBar = ({ value, max, color }) => {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 bg-${color}-500`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header user={user} />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg mb-4">
                <span className="text-4xl">✍️</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Editor Acadêmico Inteligente
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg max-w-2xl mx-auto">
                {cfg[mode].description}
              </p>
            </motion.div>

            {/* Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {Object.entries(cfg).map(([key, m]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMode(key); setFeedback(null); setShowConfig(false); }}
                  className={`relative p-6 rounded-2xl transition-all text-left overflow-hidden ${
                    mode === key 
                      ? `bg-gradient-to-r ${m.color} text-white shadow-xl scale-102`
                      : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg border-2 ${m.borderColor}`
                  }`}
                >
                  <div className="absolute top-2 right-2 text-5xl opacity-10">{m.bgIcon}</div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-3">{m.icon}</div>
                    <div className="font-bold text-xl">{m.label}</div>
                    <div className="text-sm opacity-80 mt-2">{m.description.split(' - ')[0]}</div>
                    <div className="text-xs opacity-70 mt-3">
                      📝 Mínimo {m.minWords} palavras
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {mode === 'tcc' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowConfig(!showConfig)}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2"
                >
                  <FaBook /> {showConfig ? 'Ocultar Configurações' : '⚙️ Configurar TCC'}
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.02 }} onClick={insertTemplate} className="px-5 py-2.5 bg-purple-100 text-purple-700 rounded-xl font-semibold flex items-center gap-2">
                <FaFileAlt /> 📋 Template
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} onClick={formatWithAI} disabled={formatting} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                {formatting ? <FaSpinner className="animate-spin" /> : <FaMagic />} {formatting ? 'Formatando...' : '✨ Formatação Inteligente'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} onClick={exportToPDF} className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold flex items-center gap-2">
                <FaFilePdf /> 📄 Exportar PDF
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} onClick={copyToClipboard} className="px-5 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-semibold flex items-center gap-2">
                {showCopied ? <FaCheck /> : <FaCopy />} {showCopied ? 'Copiado!' : 'Copiar'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} onClick={undoFormat} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold flex items-center gap-2">
                <FaUndo /> ↩️ Desfazer
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} onClick={clearEssay} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold">
                🗑️ Limpar
              </motion.button>
            </div>

            {/* TCC Config Panel */}
            {showConfig && mode === 'tcc' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-green-600 flex items-center gap-2">
                    <FaBook /> Configuração do TCC
                  </h3>
                  <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Título do TCC" value={tccConfig.titulo} onChange={(e) => setTccConfig({...tccConfig, titulo: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="text" placeholder="Subtítulo (opcional)" value={tccConfig.subtitulo} onChange={(e) => setTccConfig({...tccConfig, subtitulo: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="text" placeholder="Nome do Autor" value={tccConfig.autor} onChange={(e) => setTccConfig({...tccConfig, autor: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="text" placeholder="Orientador" value={tccConfig.orientador} onChange={(e) => setTccConfig({...tccConfig, orientador: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="text" placeholder="Coorientador (opcional)" value={tccConfig.coorientador} onChange={(e) => setTccConfig({...tccConfig, coorientador: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="text" placeholder="Instituição" value={tccConfig.instituicao} onChange={(e) => setTccConfig({...tccConfig, instituicao: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="text" placeholder="Curso" value={tccConfig.curso} onChange={(e) => setTccConfig({...tccConfig, curso: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="text" placeholder="Cidade" value={tccConfig.cidade} onChange={(e) => setTccConfig({...tccConfig, cidade: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                  <input type="number" placeholder="Ano" value={tccConfig.ano} onChange={(e) => setTccConfig({...tccConfig, ano: parseInt(e.target.value)})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700" />
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">📌 Após preencher os dados, clique em "✨ Formatação Inteligente" para gerar o TCC completo nas normas ABNT!</p>
                </div>
              </motion.div>
            )}

            {/* Main Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Editor Area */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-900">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                          <span>📝</span>
                          <span className="font-bold">{wordCount}</span>
                          <span className="text-xs text-gray-500">palavras</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                          <span>✏️</span>
                          <span className="font-bold">{charCount}</span>
                          <span className="text-xs text-gray-500">caracteres</span>
                        </div>
                      </div>
                      <button
                        onClick={analyzeEssay}
                        disabled={analyzing}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {analyzing ? <FaSpinner className="animate-spin" /> : <FaRobot />}
                        {analyzing ? 'Analisando...' : '🤖 Analisar com IA'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder={`✍️ Escreva ou cole seu ${cfg[mode].label} aqui...

💡 Dica: Clique em "✨ Formatação Inteligente" para estruturar automaticamente seu texto nas normas corretas!`}
                    className="w-full h-[550px] p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none resize-none font-serif text-base leading-relaxed"
                  />
                </div>
              </div>

              {/* Feedback Panel */}
              <div className="space-y-5">
                {analyzing && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">🤖 IA analisando seu trabalho...</p>
                    <p className="text-sm text-gray-500 mt-2">Análise especializada para {cfg[mode].label}</p>
                  </div>
                )}

                {formatting && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 rounded-2xl p-8 text-center shadow-xl border border-amber-200">
                    <FaMagic className="text-5xl text-amber-500 mx-auto mb-4 animate-pulse" />
                    <p className="font-medium text-amber-700">✨ IA estruturando seu documento...</p>
                    <p className="text-sm text-amber-600 mt-2">Aplicando normas {mode === 'tcc' ? 'ABNT completas' : mode === 'faculdade' ? 'científicas' : 'do ENEM'}</p>
                  </div>
                )}

                {feedback && !analyzing && (
                  <div className="space-y-5">
                    <div className={`rounded-2xl p-6 text-white text-center shadow-xl bg-gradient-to-r ${cfg[mode].color}`}>
                      <p className="text-sm opacity-90 mb-2">🎯 Nota da IA</p>
                      <p className="text-5xl font-bold">{feedback.grade}</p>
                      <p className="text-sm opacity-90 mt-2">{cfg[mode].gradeSuffix}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span>📊</span> Competências Avaliadas
                      </h3>
                      <div className="space-y-4">
                        {feedback.competences?.map((comp, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">{comp.name}</span>
                              <span className="text-purple-600 font-bold">{comp.score}{mode === 'enem' ? '/200' : '%'}</span>
                            </div>
                            <ProgressBar value={comp.score} max={mode === 'enem' ? 200 : 100} color="purple" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 rounded-2xl p-5 shadow-xl border border-green-200">
                      <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">✅ Pontos Fortes</h3>
                      <ul className="space-y-2">
                        {feedback.strengths?.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2"><span className="text-green-500">★</span> {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 rounded-2xl p-5 shadow-xl border border-yellow-200">
                      <h3 className="font-bold text-yellow-700 mb-3 flex items-center gap-2">⚠️ Melhorias</h3>
                      <ul className="space-y-2">
                        {feedback.improvements?.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2"><span className="text-yellow-500">◆</span> {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 rounded-2xl p-5 shadow-xl border border-blue-200">
                      <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2">💡 Sugestões</h3>
                      <ul className="space-y-2">
                        {feedback.suggestions?.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2"><span className="text-blue-500">→</span> {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {!feedback && !analyzing && !formatting && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 rounded-2xl p-6 shadow-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">💡</div>
                      <h3 className="font-bold text-purple-700 text-lg">Dicas para {cfg[mode].label}</h3>
                    </div>
                    <ul className="space-y-3">
                      {cfg[mode].tips?.slice(0, 5).map((tip, i) => (
                        <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2">
                          <span className="text-purple-500">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 p-3 bg-white dark:bg-gray-700 rounded-xl text-center">
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        💪 {mode === 'tcc' ? 'TCC formatado com IA conforme ABNT NBR 14724' : mode === 'faculdade' ? 'Trabalho formatado com rigor científico' : 'Redação com estrutura ENEM nota 1000'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== PDF MANAGER COMPLETO ==========
const PDFManager = ({ user }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📚 Biblioteca Inteligente
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Transforme seus PDFs em materiais de estudo interativos com IA
              </p>
            </motion.div>
            <PDFUploader />
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== PÁGINAS EM DESENVOLVIMENTO (ESTILIZADAS) ==========
const CognitiveMap = ({ user }) => (
  <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar user={user} />
    <div className="flex-1 overflow-auto">
      <Header user={user} />
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-20">
            <div className="text-8xl mb-6">🧠</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Mapa Cognitivo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Visualize seu desempenho acadêmico em tempo real
            </p>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <p className="text-2xl font-bold mb-2">📊 Em breve</p>
              <p>Gráficos interativos e análises detalhadas do seu progresso</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
);

const SocialNetwork = ({ user }) => (
  <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar user={user} />
    <div className="flex-1 overflow-auto">
      <Header user={user} />
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-20">
            <div className="text-8xl mb-6">👥</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Rede Social Acadêmica
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Conecte-se com outros estudantes e compartilhe conhecimento
            </p>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <p className="text-2xl font-bold mb-2">🌐 Em desenvolvimento</p>
              <p>Feed de posts, grupos de estudo e interações em breve</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
);

const StudyGroups = ({ user }) => (
  <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar user={user} />
    <div className="flex-1 overflow-auto">
      <Header user={user} />
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-20">
            <div className="text-8xl mb-6">👨‍👩‍👧‍👦</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Grupos de Estudo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Estude em grupo e aprenda mais rápido
            </p>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <p className="text-2xl font-bold mb-2">💬 Em breve</p>
              <p>Salas de estudo, chat em tempo real e compartilhamento de materiais</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
);

const AntiProcrastination = ({ user }) => (
  <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar user={user} />
    <div className="flex-1 overflow-auto">
      <Header user={user} />
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-20">
            <div className="text-8xl mb-6">⚡</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Sistema Anti-Procrastinação
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Mantenha o foco e maximize sua produtividade
            </p>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <p className="text-2xl font-bold mb-2">🎯 Em breve</p>
              <p>Timer Pomodoro, metas diárias e sistema de recompensas</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
);

// ========== LOGIN COMPLETO E ESTILIZADO ==========
const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('As senhas não coincidem');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }

      const result = await registerUser(formData.email, formData.password, formData.name);
      if (result.success) {
        toast.success('Cadastro realizado com sucesso! 🎉');
        navigate('/');
      } else {
        if (result.error.includes('email-already-in-use')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(result.error);
        }
      }
    } else {
      const result = await loginUser(formData.email, formData.password);
      if (result.success) {
        toast.success(`Bem-vindo de volta, ${result.user.email?.split('@')[0]}! 🚀`);
        navigate('/');
      } else {
        if (result.error.includes('user-not-found')) {
          toast.error('Usuário não encontrado');
        } else if (result.error.includes('wrong-password')) {
          toast.error('Senha incorreta');
        } else {
          toast.error(result.error);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-6xl mb-4"
          >
            🎓
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ScholarOS
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta gratuita'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Seu nome completo"
              />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="seu@email.com"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </motion.div>

          {!isLogin && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="••••••"
              />
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            }}
            className="text-purple-600 hover:text-purple-700 font-medium transition-all"
          >
            {isLogin ? '📝 Não tem uma conta? Cadastre-se' : '🔑 Já tem uma conta? Faça login'}
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <button
              onClick={async () => {
                if (!formData.email) {
                  toast.error('Digite seu email para recuperar a senha');
                  return;
                }
                const result = await resetPassword(formData.email);
                if (result.success) {
                  toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
                } else {
                  toast.error(result.error);
                }
              }}
              className="text-sm text-gray-500 hover:text-purple-600 transition-all"
            >
              Esqueceu a senha?
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ========== COMPONENTE PRINCIPAL ==========
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/essay" element={user ? <EssayEditor user={user} /> : <Navigate to="/login" />} />
          <Route path="/pdfs" element={user ? <PDFManager user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="/cognitive-map" element={user ? <CognitiveMap user={user} /> : <Navigate to="/login" />} />
          <Route path="/social" element={user ? <SocialNetwork user={user} /> : <Navigate to="/login" />} />
          <Route path="/groups" element={user ? <StudyGroups user={user} /> : <Navigate to="/login" />} />
          <Route path="/productivity" element={user ? <AntiProcrastination user={user} /> : <Navigate to="/login" />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;