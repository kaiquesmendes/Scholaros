import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaBook, FaFileAlt, FaFilePdf, FaMagic, FaSpinner, 
  FaCheck, FaCopy, FaUndo, FaRobot, FaChartLine, 
  FaLightbulb, FaQuoteRight, FaListOl, FaSave, FaEye, FaDownload 
} from 'react-icons/fa';

// IMPORTS DO FIREBASE (tudo do mesmo lugar)
import { 
  auth, 
  db,
  doc,
  getDoc,
  setDoc, 
  updateDoc,
  onAuthStateChanged,
  loginUser,
  registerUser,
  logoutUser,
  resetPassword,
  getFullUserData,
  updateStudyStats
} from './config/firebase';

// Outros serviços
import { checkBadges } from './services/badgeService';

// Componentes
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PDFUploader from './components/PDFUploader';
import Profile from './pages/Profile';
import SocialNetwork from './pages/SocialNetwork';
import StudyGroups from './pages/StudyGroups';
import PDFManager from './pages/PDFManager';

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


// ========== COMPONENTES AUXILIARES ==========
const StatCard = ({ icon, label, value, change, color }) => {
  const colorClasses = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} bg-opacity-20 flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <span className="text-sm text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
          {change}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{value}</h3>
      <p className="text-gray-600 dark:text-gray-400 mt-1">{label}</p>
    </motion.div>
  );
};

const SubjectProgressCard = ({ subject, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempHours, setTempHours] = useState(0);
  
  const handleAddHours = () => {
    if (tempHours > 0) {
      onUpdate(subject.name, 0, tempHours);
      setIsEditing(false);
      setTempHours(0);
    }
  };
  
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }}></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">{subject.name}</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-500">{subject.hours || 0}h estudadas</span>
          <span className="text-sm font-semibold" style={{ color: subject.color }}>{subject.progress || 0}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${subject.progress || 0}%` }}
          transition={{ duration: 1 }}
          className="h-full rounded-full transition-all"
          style={{ backgroundColor: subject.color }}
        />
      </div>
      {isEditing ? (
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={tempHours}
            onChange={(e) => setTempHours(parseFloat(e.target.value) || 0)}
            placeholder="Horas"
            className="w-24 px-2 py-1 text-sm border rounded-lg dark:bg-gray-700"
            step="0.5"
            min="0"
          />
          <button onClick={handleAddHours} className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg">Adicionar</button>
          <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-xs bg-gray-500 text-white rounded-lg">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setIsEditing(true)} className="mt-2 text-xs text-purple-600 hover:underline">
          + Adicionar horas
        </button>
      )}
    </motion.div>
  );
};

const ActivityCard = ({ activity, index }) => {
  const icons = {
    '✍️': 'bg-purple-100 dark:bg-purple-900/30',
    '📄': 'bg-blue-100 dark:bg-blue-900/30',
    '🏆': 'bg-yellow-100 dark:bg-yellow-900/30',
    '📚': 'bg-green-100 dark:bg-green-900/30',
    '🎉': 'bg-pink-100 dark:bg-pink-900/30'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-full ${icons[activity.icon] || 'bg-gray-100'} flex items-center justify-center text-xl`}>
        {activity.icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800 dark:text-white">{activity.title}</p>
        {activity.description && <p className="text-sm text-gray-500">{activity.description}</p>}
        {activity.score && <p className="text-sm text-green-600">Nota: {activity.score}</p>}
        {activity.pages && <p className="text-sm text-blue-600">{activity.pages} páginas</p>}
        <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
      </div>
      <div className="text-gray-400">→</div>
    </motion.div>
  );
};

// ========== DASHBOARD PRINCIPAL ==========
const Dashboard = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stats, setStats] = useState({
    streak: 0,
    totalHours: 0,
    completedGoals: 0,
    totalGoals: 50,
    averageRetention: 0
  });
  const [loading, setLoading] = useState(true);

  // Buscar dados reais do usuário no Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const result = await getFullUserData(user.uid);
        
        if (result.success) {
          const data = result.data;
          setUserData(data);
          
          setStats({
            streak: data.stats?.currentStreak || 0,
            totalHours: data.stats?.totalStudyHours || 0,
            completedGoals: data.stats?.completedGoals || 0,
            totalGoals: data.stats?.totalGoals || 50,
            averageRetention: data.stats?.averageRetention || 0
          });
          
          setSubjects(data.subjects || [
            { name: 'Matemática', progress: 0, color: '#8b5cf6', hours: 0, goal: 50 },
            { name: 'Português', progress: 0, color: '#ec4899', hours: 0, goal: 50 },
            { name: 'Redação', progress: 0, color: '#06b6d4', hours: 0, goal: 50 },
            { name: 'Física', progress: 0, color: '#f59e0b', hours: 0, goal: 50 },
            { name: 'Química', progress: 0, color: '#10b981', hours: 0, goal: 50 },
          ]);
          
          setRecentActivities(data.recentActivities?.slice(0, 5) || []);
        } else {
          console.log('Usuário sem dados, criando padrão');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Função para atualizar progresso de matéria
  const updateSubjectProgress = async (subjectName, newProgress, newHours) => {
    if (!newHours || newHours <= 0) return;
    
    setLoading(true);
    
    try {
      const result = await updateStudyStats(user.uid, newHours, subjectName);
      
      if (result.success) {
        const userResult = await getFullUserData(user.uid);
        if (userResult.success) {
          const data = userResult.data;
          setUserData(data);
          setSubjects(data.subjects || []);
          setStats({
            streak: data.stats?.currentStreak || 0,
            totalHours: data.stats?.totalStudyHours || 0,
            completedGoals: data.stats?.completedGoals || 0,
            totalGoals: data.stats?.totalGoals || 50,
            averageRetention: data.stats?.averageRetention || 0
          });
          setRecentActivities(data.recentActivities?.slice(0, 5) || []);
          
          await checkBadges(user.uid, 'study', data.stats?.totalStudyHours);
          
          toast.success(`✨ +${newHours}h em ${subjectName}! +${newHours * 10} XP`);
        }
      } else {
        toast.error('Erro ao registrar estudo');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar progresso');
    } finally {
      setLoading(false);
    }
  };

  // Calcular nível do usuário
  const userLevel = Math.floor(stats.totalHours / 50) + 1;
  const nextLevelXP = userLevel * 50;
  const currentXP = stats.totalHours % 50;
  const xpProgress = (currentXP / nextLevelXP) * 100;
  const overallProgress = subjects.length > 0 
    ? Math.round(subjects.reduce((acc, sub) => acc + (sub.progress || 0), 0) / subjects.length) 
    : 0;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando seu dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        <main className="p-6">
          {/* Welcome Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Olá, {userData?.name || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Nível {userLevel} • {currentXP}/{nextLevelXP} XP • {stats.streak} dias consecutivos
            </p>
            <div className="mt-3 w-full max-w-md">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Progresso para próximo nível</span>
                <span>{Math.round(xpProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all" style={{ width: `${xpProgress}%` }}></div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon="🔥" label="Sequência" value={`${stats.streak} dias`} change={stats.streak > 0 ? `${stats.streak} dias seguidos` : 'Comece hoje!'} color="orange" />
            <StatCard icon="⏱️" label="Horas Estudadas" value={`${stats.totalHours}h`} change={`Média ${Math.round(stats.totalHours / (stats.streak || 1))}h/dia`} color="blue" />
            <StatCard icon="🎯" label="Metas Concluídas" value={`${stats.completedGoals}/${stats.totalGoals}`} change={`${Math.round((stats.completedGoals / stats.totalGoals) * 100)}% concluído`} color="green" />
            <StatCard icon="🧠" label="Retenção Média" value={`${stats.averageRetention}%`} change={stats.averageRetention > 70 ? 'Bom desempenho!' : 'Foco em revisões'} color="purple" />
          </div>

          {/* Progress and Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                  📊 Progresso por Matéria
                </h3>
                <span className="text-sm text-purple-600">Média: {overallProgress}%</span>
              </div>
              <div className="space-y-5">
                {subjects.map((subject, idx) => (
                  <SubjectProgressCard key={idx} subject={subject} onUpdate={updateSubjectProgress} />
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                📝 Atividades Recentes
              </h3>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, idx) => (
                    <ActivityCard key={activity.id || idx} activity={activity} index={idx} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma atividade registrada ainda</p>
                    <p className="text-sm mt-2">Comece a estudar para ver seu progresso!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Radar de Aprovação */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">🎯 Radar de Aprovação</h3>
                <p className="text-white/80">Seu nível de preparação com base no seu desempenho</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-1">{overallProgress}%</div>
                <p className="text-white/80 text-sm">Nível de Preparação</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subjects.slice(0, 4).map((subject, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm text-white mb-1">
                    <span>{subject.name}</span>
                    <span>{subject.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${subject.progress || 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap justify-between text-white/80 text-sm gap-2">
              <span>📊 Total de estudos: {stats.totalHours} horas</span>
              <span>🎯 Meta da semana: {Math.max(0, 10 - Math.floor(stats.totalHours / 10))}h para próximo nível</span>
            </div>
          </motion.div>

          {/* Próximas Conquistas */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              🏆 Próximas Conquistas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Leitor Voraz', progress: userData?.stats?.totalPDFsProcessed || 0, goal: 50, icon: '📚' },
                { name: 'Mestre das Redações', progress: userData?.stats?.totalEssaysWritten || 0, goal: 10, icon: '✍️' },
                { name: 'Mestre dos Estudos', progress: stats.totalHours, goal: 100, icon: '🎓' },
                { name: 'Dedicado', progress: stats.streak, goal: 30, icon: '🔥' }
              ].map((badge, idx) => {
                const progressPercent = Math.min(100, (badge.progress / badge.goal) * 100);
                return (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="font-semibold text-sm">{badge.name}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">{badge.progress}/{badge.goal}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
          
          {/* Botões de ação */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => {
                const hours = prompt('Quantas horas você estudou hoje?', '1');
                if (hours && !isNaN(parseFloat(hours))) {
                  const subject = prompt('Qual matéria você estudou?', 'Matemática');
                  if (subject) {
                    updateSubjectProgress(subject, 0, parseFloat(hours));
                  }
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all"
            >
              + Adicionar Horas de Estudo
            </button>
            
            <Link 
              to="/profile"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              Ver estatísticas completas →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

// frontend/src/pages/EssayEditor.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBook, FaFileAlt, FaFilePdf, FaMagic, FaSpinner, 
  FaCheck, FaCopy, FaUndo, FaRobot, FaChartLine, 
  FaLightbulb, FaQuoteRight, FaListOl, FaTimes,
  FaUserGraduate, FaUniversity, FaSearch, FaStar,
  FaClipboardList, FaChartBar, FaPenFancy
} from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getFullUserData, updateDoc, doc, db, registerEssay } from '../config/firebase';
import { checkBadges } from '../services/badgeService';
import toast from 'react-hot-toast';

const EssayEditor = ({ user }) => {
  // Estados principais
  const [essay, setEssay] = useState('');
  const [originalEssay, setOriginalEssay] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [professorFeedback, setProfessorFeedback] = useState(null);
  const [mode, setMode] = useState('enem');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Modos avançados
  const [professorMode, setProfessorMode] = useState(false);
  const [strictABNT, setStrictABNT] = useState(false);
  const [humanizerMode, setHumanizerMode] = useState(false);
  const [expansionMode, setExpansionMode] = useState(false);
  const [formatterMode, setFormatterMode] = useState(false);
  
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

  // Configurações por modo
  const cfg = {
    enem: { 
      label: 'ENEM', icon: '🎯', bgIcon: '✍️', color: '#7c3aed',
      minWords: 50, gradeSuffix: '/1000', gradeMax: 1000, competenceMax: 200,
      description: 'Correção estilo ENEM - Redação Dissertativa-Argumentativa',
      tips: [
        '📝 Introdução com tese clara e definida',
        '🎯 Cada parágrafo = uma ideia principal',
        '🔗 Use conectivos variados (portanto, além disso, consequentemente)',
        '💭 Conclusão com proposta de intervenção completa (agente, ação, meio, efeito)',
        '📚 Repertório sociocultural diversificado'
      ]
    },
    faculdade: { 
      label: 'FACULDADE', icon: '🎓', bgIcon: '📚', color: '#2563eb',
      minWords: 200, gradeSuffix: '%', gradeMax: 100, competenceMax: 100,
      description: 'Formato ABNT para Artigos e Trabalhos Acadêmicos',
      tips: [
        '🔍 Problema de pesquisa bem definido',
        '📊 Metodologia adequada aos objetivos',
        '📖 Revisão bibliográfica atualizada',
        '💡 Contribuição original para a área',
        '🗣️ Linguagem científica e impessoal'
      ]
    },
    tcc: { 
      label: 'TCC', icon: '🏆', bgIcon: '📖', color: '#059669',
      minWords: 500, gradeSuffix: '%', gradeMax: 100, competenceMax: 100,
      description: 'Formatação ABNT completa para Trabalho de Conclusão de Curso',
      tips: [
        '📚 Siga rigorosamente as normas ABNT (NBR 14724)',
        '🔬 Metodologia detalhada e replicável',
        '📊 Resultados com análise estatística adequada',
        '💬 Discussão comparando com a literatura',
        '📝 Conclusão com contribuições e limitações'
      ]
    },
  };

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      const result = await getFullUserData(user.uid);
      if (result.success) setUserData(result.data);
    };
    fetchUserData();
  }, [user]);

  // Contar palavras e caracteres
  useEffect(() => {
    const words = essay.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    setCharCount(essay.length);
  }, [essay]);

  // Templates avançados
  const templates = {
    enem: `🎯 REDAÇÃO ENEM - ESTRUTURA NOTA 1000

[INTRODUÇÃO - 4 a 5 linhas]
A discussão sobre [TEMA] é de extrema relevância no contexto brasileiro contemporâneo. Historicamente, observa-se que [contextualização histórica]. Diante desse cenário, é fundamental analisar [problema central], bem como propor soluções efetivas para [questão abordada].

[DESENVOLVIMENTO 1 - 6 a 8 linhas]
Em primeiro lugar, é importante destacar que [argumento 1]. Segundo [autor renomado], "[citação relevante]" (ANO, p. X). Isso evidencia que [conexão com o tema]. Ademais, dados do [fonte confiável] apontam que [estatística], o que reforça a necessidade de [ação específica].

[DESENVOLVIMENTO 2 - 6 a 8 linhas]
Além disso, outro aspecto fundamental reside em [argumento 2]. Conforme [filósofo/teórico], "[citação pertinente]" (ANO, p. Y). Dessa forma, percebe-se que [desdobramento do argumento]. Nesse sentido, [exemplo prático] demonstra a urgência da questão.

[CONCLUSÃO - 5 a 6 linhas]
Portanto, faz-se necessária uma intervenção estatal e social para mitigar [problema central]. O governo, em parceria com [agentes envolvidos], deve [ação específica] por meio de [meio de implementação]. Espera-se que, com tais medidas, [resultado esperado], contribuindo para uma sociedade mais justa e igualitária.`,

    faculdade: `🎓 ARTIGO CIENTÍFICO - ESTRUTURA ABNT

TÍTULO DO ARTIGO (centralizado, negrito, fonte 12)

Autor: [Nome do Autor]
Instituição: [Nome da Instituição]

RESUMO
[Escreva um resumo de 150-250 palavras apresentando: contexto, objetivo, metodologia, resultados e conclusão]

Palavras-chave: palavra1; palavra2; palavra3; palavra4.

ABSTRACT
[Write an abstract in English with the same structure]

Keywords: keyword1; keyword2; keyword3; keyword4.

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

    tcc: `🏆 TRABALHO DE CONCLUSÃO DE CURSO - FORMATO ABNT COMPLETO

[ELEMENTOS PRÉ-TEXTUAIS]

UNIVERSIDADE [NOME DA INSTITUIÇÃO]
[ NOME DO CURSO ]

[ TÍTULO DO TRABALHO ]

[ Subtítulo do trabalho (se houver) ]

[ NOME DO AUTOR ]

Orientador: Prof. [NOME DO ORIENTADOR]

[CIDADE]
[ANO]

FOLHA DE ROSTO
[ NOME DO AUTOR ]
[ TÍTULO DO TRABALHO ]
Trabalho de Conclusão de Curso apresentado à [INSTITUIÇÃO] como requisito parcial para obtenção do título de [CURSO].
Orientador: Prof. [NOME DO ORIENTADOR]

RESUMO
[Escreva um resumo de 250-500 palavras apresentando: contexto, problema, objetivos, metodologia, resultados e conclusão]

Palavras-chave: palavra1; palavra2; palavra3; palavra4; palavra5.

ABSTRACT
[Write an abstract in English - 250-500 words, same structure]

Keywords: keyword1; keyword2; keyword3; keyword4; keyword5.

SUMÁRIO

1 INTRODUÇÃO
1.1 Contextualização do problema
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

REFERÊNCIAS (ABNT NBR 6023)
SOBRENOME, Nome. Título da obra. Edição. Local: Editora, Ano.
SOBRENOME, Nome. Título do artigo. Revista, v. n, p. inicial-final, mês ano.

APÊNDICES (opcional)
ANEXOS (opcional)`
  };

  // Registrar redação no sistema
  const registerEssayWritten = async (score) => {
    try {
      const result = await registerEssay(user.uid, score);
      if (result.success) {
        toast.success(`✍️ +50 XP! Redação registrada`);
      }
      await checkBadges(user.uid, 'essay', userData?.stats?.totalEssaysWritten + 1 || 1);
    } catch (error) {
      console.error('Erro ao registrar redação:', error);
    }
  };

  // Analisar com IA (versão avançada)
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
      let modeText = '';
      if (professorMode) modeText += ' Ativar MODO PROFESSOR - gere análise detalhada, críticas construtivas e avaliação técnica.';
      if (strictABNT) modeText += ' Ativar MODO STRICT ABNT - valide formatação, referências e citações.';
      if (humanizerMode) modeText += ' Ativar MODO HUMANIZADOR - torne o texto mais natural.';
      if (expansionMode) modeText += ' Ativar MODO EXPANSÃO - expanda ideias curtas.';
      if (formatterMode) modeText += ' Ativar MODO FORMATADOR - corrija estrutura e formatação.';

      const response = await axios.post('https://scholaros-5ncu.onrender.com/api/essay/analyze', {
        content: essay,
        mode: mode,
        professorMode: professorMode,
        strictABNT: strictABNT,
        humanizerMode: humanizerMode,
        expansionMode: expansionMode,
        formatterMode: formatterMode,
        tccConfig: tccConfig
      });
      
      setFeedback(response.data.feedback || response.data);
      if (response.data.professorNotes) {
        setProfessorFeedback(response.data.professorNotes);
      }
      
      await registerEssayWritten(response.data.grade);
      
      let notaDisplay = mode === 'enem' ? `${response.data.grade}/1000` : `${response.data.grade}%`;
      toast.success(`✅ Análise concluída! Nota: ${notaDisplay}`, { id: 'analyzing' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro na análise. Usando simulação.', { id: 'analyzing' });
      
      const mockScore = mode === 'enem' ? 780 : 82;
      setFeedback({
        grade: mockScore,
        competences: [
          { name: 'Competência 1 - Domínio da norma culta', score: mode === 'enem' ? 160 : 85 },
          { name: 'Competência 2 - Compreensão da proposta', score: mode === 'enem' ? 155 : 82 },
          { name: 'Competência 3 - Argumentação', score: mode === 'enem' ? 150 : 80 },
          { name: 'Competência 4 - Conectivos', score: mode === 'enem' ? 160 : 83 },
          { name: 'Competência 5 - Proposta de intervenção', score: mode === 'enem' ? 155 : 82 }
        ],
        strengths: [
          '🎯 Excelente estrutura textual com introdução, desenvolvimento e conclusão',
          '💡 Argumentos coerentes e bem fundamentados',
          '📚 Bom repertório sociocultural e referências acadêmicas'
        ],
        improvements: [
          '🔍 Aprofundar a argumentação nos parágrafos de desenvolvimento',
          '✍️ Melhorar a proposta de intervenção com mais detalhes',
          '📖 Revisar pequenos desvios gramaticais e de concordância'
        ],
        suggestions: [
          '🎓 Leia redações nota 1000 para referência de estrutura',
          '📝 Faça um planejamento antes de escrever',
          '🔄 Revise sempre após terminar de escrever'
        ],
        alerts: []
      });
      await registerEssayWritten(mockScore);
    } finally {
      setAnalyzing(false);
    }
  };

  // Formatação inteligente ABNT
  const formatWithAI = async () => {
    if (!essay.trim()) {
      toast.error(`📝 Cole seu ${cfg[mode].label} primeiro!`);
      return;
    }
    if (wordCount < cfg[mode].minWords) {
      toast.error(`⚠️ Mínimo ${cfg[mode].minWords} palavras (atual: ${wordCount})`);
      return;
    }

    setFormatting(true);
    setOriginalEssay(essay);
    
    let modeText = '';
    if (strictABNT) modeText += ' Aplicar rigorosamente normas ABNT (NBR 14724, 10520, 6023, 6028).';
    if (humanizerMode) modeText += ' Humanizar o texto, evitar padrões de IA.';
    if (expansionMode) modeText += ' Expandir ideias curtas mantendo coerência.';
    if (formatterMode) modeText += ' Corrigir estrutura, títulos e formatação.';
    
    toast.loading(`🤖 IA formatando seu ${cfg[mode].label}...`, { id: 'format' });

    try {
      const response = await axios.post('https://scholaros-5ncu.onrender.com/api/essay/format-abnt', {
        content: essay,
        mode: mode,
        tccConfig: tccConfig,
        strictABNT: strictABNT,
        humanizerMode: humanizerMode,
        expansionMode: expansionMode,
        formatterMode: formatterMode
      });

      const formattedText = response.data.formattedText || response.data.content;
      setEssay(formattedText);
      toast.success(`✅ ${cfg[mode].label} formatado com sucesso!`, { id: 'format' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro na formatação', { id: 'format' });
    } finally {
      setFormatting(false);
    }
  };

  const insertTemplate = () => {
    if (essay.trim() && !window.confirm("Inserir template substituirá o conteúdo atual. Continuar?")) return;
    setEssay(templates[mode]);
    setFeedback(null);
    setProfessorFeedback(null);
    toast.success(`📋 Template ${cfg[mode].label} inserido!`);
  };

  const clearEssay = () => {
    if (essay.trim() && !window.confirm("Limpar todo o texto?")) return;
    setEssay('');
    setOriginalEssay('');
    setFeedback(null);
    setProfessorFeedback(null);
    toast.success('✨ Texto limpo!');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(essay);
    setShowCopied(true);
    toast.success('📋 Copiado!');
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
  .title { font-size: 18pt; font-weight: bold; color: #1a1a2e; }
  .subtitle { font-size: 14pt; color: #555; margin-top: 5px; }
  .meta { font-size: 10pt; color: #666; margin-top: 8px; }
  pre { white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
  .footer { text-align: center; font-size: 9pt; color: #888; margin-top: 40px; padding-top: 12px; border-top: 1px solid #ccc; }
  h1, h2, h3 { color: #1a1a2e; margin-top: 20px; }
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
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg mb-4">
                <span className="text-4xl">✍️</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                      ? 'text-white shadow-xl'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg border-2 border-gray-200'
                  }`}
                  style={mode === key ? { background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` } : {}}
                >
                  <div className="absolute top-2 right-2 text-5xl opacity-10">{m.bgIcon}</div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-3">{m.icon}</div>
                    <div className="font-bold text-xl">{m.label}</div>
                    <div className="text-sm opacity-80 mt-2">{m.description.split(' - ')[0]}</div>
                    <div className="text-xs opacity-70 mt-3">📝 Mínimo {m.minWords} palavras</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Modos Avançados */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={() => setProfessorMode(!professorMode)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${professorMode ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <FaUserGraduate size={12} /> Modo Professor
              </button>
              <button 
                onClick={() => setStrictABNT(!strictABNT)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${strictABNT ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <FaBook size={12} /> Strict ABNT
              </button>
              <button 
                onClick={() => setHumanizerMode(!humanizerMode)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${humanizerMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <FaPenFancy size={12} /> Humanizar
              </button>
              <button 
                onClick={() => setExpansionMode(!expansionMode)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${expansionMode ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <FaChartLine size={12} /> Expandir
              </button>
              <button 
                onClick={() => setFormatterMode(!formatterMode)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${formatterMode ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <FaClipboardList size={12} /> Formatador
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {mode === 'tcc' && (
                <button onClick={() => setShowConfig(!showConfig)} className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700">
                  <FaUniversity /> {showConfig ? 'Ocultar' : 'Configurar TCC'}
                </button>
              )}
              <button onClick={insertTemplate} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-purple-200">
                <FaFileAlt /> Inserir Template
              </button>
              <button onClick={formatWithAI} disabled={formatting} className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-amber-600">
                {formatting ? <FaSpinner className="animate-spin" /> : <FaMagic />} {formatting ? 'Formatando...' : 'Formatação IA'}
              </button>
              <button onClick={exportToPDF} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-200">
                <FaFilePdf /> Exportar PDF
              </button>
              <button onClick={copyToClipboard} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold flex items-center gap-2">
                {showCopied ? <FaCheck /> : <FaCopy />} Copiar
              </button>
              <button onClick={undoFormat} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold flex items-center gap-2">
                <FaUndo /> Desfazer
              </button>
              <button onClick={clearEssay} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl">
                Limpar
              </button>
            </div>

            {/* TCC Config Panel */}
            {showConfig && mode === 'tcc' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-6 border-2 border-green-200">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-green-600">📋 Configuração do TCC</h3>
                  <button onClick={() => setShowConfig(false)} className="text-gray-400 text-xl hover:text-gray-600">✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Título do TCC" value={tccConfig.titulo} onChange={(e) => setTccConfig({...tccConfig, titulo: e.target.value})} className="px-4 py-2 border rounded-lg dark:bg-gray-700" />
                  <input type="text" placeholder="Subtítulo" value={tccConfig.subtitulo} onChange={(e) => setTccConfig({...tccConfig, subtitulo: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Autor" value={tccConfig.autor} onChange={(e) => setTccConfig({...tccConfig, autor: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Orientador" value={tccConfig.orientador} onChange={(e) => setTccConfig({...tccConfig, orientador: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Coorientador" value={tccConfig.coorientador} onChange={(e) => setTccConfig({...tccConfig, coorientador: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Instituição" value={tccConfig.instituicao} onChange={(e) => setTccConfig({...tccConfig, instituicao: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Curso" value={tccConfig.curso} onChange={(e) => setTccConfig({...tccConfig, curso: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Cidade" value={tccConfig.cidade} onChange={(e) => setTccConfig({...tccConfig, cidade: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="number" placeholder="Ano" value={tccConfig.ano} onChange={(e) => setTccConfig({...tccConfig, ano: parseInt(e.target.value)})} className="px-4 py-2 border rounded-lg" />
                </div>
              </motion.div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                          <span>📝</span> <strong>{wordCount}</strong> <span className="text-xs text-gray-500">palavras</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                          <span>✏️</span> <strong>{charCount}</strong> <span className="text-xs text-gray-500">caracteres</span>
                        </div>
                      </div>
                      <button
                        onClick={analyzeEssay}
                        disabled={analyzing}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2 hover:opacity-90 transition-all"
                      >
                        {analyzing ? <FaSpinner className="animate-spin" /> : <FaRobot />}
                        {analyzing ? 'Analisando...' : 'Analisar com IA'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder={`✍️ Escreva ou cole seu ${cfg[mode].label} aqui...\n\n📌 Dicas:\n• Use "Formatação IA" para estruturar automaticamente\n• Ative "Modo Professor" para análise detalhada\n• Ative "Strict ABNT" para formatação rigorosa`}
                    className="w-full h-[550px] p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none resize-none font-serif text-base leading-relaxed"
                  />
                </div>
              </div>

              {/* Feedback Panel */}
              <div className="space-y-5">
                {analyzing && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">🤖 IA analisando...</p>
                    <p className="text-sm text-gray-500 mt-2">Análise especializada para {cfg[mode].label}</p>
                  </div>
                )}

                {formatting && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-8 text-center shadow-xl border border-amber-200">
                    <FaMagic className="text-5xl text-amber-500 mx-auto mb-4 animate-pulse" />
                    <p className="font-medium text-amber-700">✨ IA estruturando seu documento...</p>
                    <p className="text-sm text-amber-600 mt-2">Aplicando normas {mode === 'tcc' ? 'ABNT completas' : mode === 'faculdade' ? 'científicas' : 'do ENEM'}</p>
                  </div>
                )}

                {feedback && !analyzing && (
                  <div className="space-y-5">
                    <div className="rounded-2xl p-6 text-white text-center shadow-xl" style={{ background: `linear-gradient(135deg, ${cfg[mode].color}, ${cfg[mode].color}cc)` }}>
                      <p className="text-sm opacity-90 mb-2">🎯 Nota da IA</p>
                      <p className="text-5xl font-bold">{feedback.grade}</p>
                      <p className="text-sm opacity-90 mt-2">{cfg[mode].gradeSuffix}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">📊 Competências Avaliadas</h3>
                      <div className="space-y-4">
                        {feedback.competences?.slice(0, 5).map((comp, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">{comp.name}</span>
                              <span className="text-purple-600 font-bold">{comp.score}{mode === 'enem' ? '/200' : '%'}</span>
                            </div>
                            <ProgressBar value={comp.score} max={mode === 'enem' ? 200 : 100} color={cfg[mode].color} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 shadow-xl border border-green-200">
                      <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">✅ Pontos Fortes</h3>
                      <ul className="space-y-2">
                        {feedback.strengths?.slice(0, 4).map((s, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2"><span className="text-green-500">★</span> {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-5 shadow-xl border border-yellow-200">
                      <h3 className="font-bold text-yellow-700 mb-3 flex items-center gap-2">⚠️ Pontos de Melhoria</h3>
                      <ul className="space-y-2">
                        {feedback.improvements?.slice(0, 4).map((s, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2"><span className="text-yellow-500">◆</span> {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 shadow-xl border border-blue-200">
                      <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2">💡 Sugestões da IA</h3>
                      <ul className="space-y-2">
                        {feedback.suggestions?.slice(0, 4).map((s, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2"><span className="text-blue-500">→</span> {s}</li>
                        ))}
                      </ul>
                    </div>

                    {feedback.alerts && feedback.alerts.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 shadow-xl border border-red-200">
                        <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">⚠️ Alertas Acadêmicos</h3>
                        <ul className="space-y-2">
                          {feedback.alerts.map((alert, i) => (
                            <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2"><span className="text-red-500">!</span> {alert}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {!feedback && !analyzing && !formatting && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 rounded-2xl p-6 shadow-xl border border-purple-200">
                    <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-4 text-lg">💡 Dicas para {cfg[mode].label}</h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {cfg[mode].tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-xl text-center">
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {mode === 'tcc' ? '✅ Ative "Modo Professor" e "Strict ABNT" para análise completa' : 
                         mode === 'faculdade' ? '✅ Ative "Modo Professor" para feedback detalhado' : 
                         '✅ Use o template para estrutura ideal do ENEM'}
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


const CognitiveMap = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [chartType, setChartType] = useState('progress');
  const [studyData, setStudyData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [insights, setInsights] = useState([]);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const result = await getFullUserData(user.uid);
        if (result.success) {
          setUserData(result.data);
          processData(result.data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Processar dados para os gráficos
  const processData = (data) => {
    const stats = data.stats || {};
    const subjects = data.subjects || [];
    const activities = data.recentActivities || [];

    // Dados de progresso por matéria
    const subjectProgress = subjects.map(sub => ({
      subject: sub.name,
      progress: sub.progress || 0,
      hours: sub.hours || 0,
      goal: sub.goal || 50,
      color: sub.color
    }));
    setSubjectData(subjectProgress);

    // Dados de estudo semanal (simulados com base nas horas totais)
    const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const totalHours = stats.totalStudyHours || 0;
    const weeklyDist = weekDays.map((day, idx) => ({
      day: day,
      hours: Math.round((totalHours / 7) * (0.8 + Math.random() * 0.7)),
      productivity: Math.round(60 + Math.random() * 35)
    }));
    setWeeklyData(weeklyDist);

    // Dados de produtividade por hora do dia
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      productivity: Math.round(40 + Math.sin(i * Math.PI / 12) * 30 + Math.random() * 15),
      studies: Math.round(5 + Math.sin(i * Math.PI / 12) * 4)
    }));
    setHourlyData(hours);

    // Dados de performance (simulados)
    const performance = [
      { name: 'Matemática', value: subjects.find(s => s.name === 'Matemática')?.progress || 65, fullMark: 100 },
      { name: 'Português', value: subjects.find(s => s.name === 'Português')?.progress || 70, fullMark: 100 },
      { name: 'Redação', value: subjects.find(s => s.name === 'Redação')?.progress || 60, fullMark: 100 },
      { name: 'Física', value: subjects.find(s => s.name === 'Física')?.progress || 55, fullMark: 100 },
      { name: 'Química', value: subjects.find(s => s.name === 'Química')?.progress || 58, fullMark: 100 }
    ];
    setPerformanceData(performance);

    // Gerar insights
    const newInsights = [];
    const bestSubject = subjectProgress.reduce((best, sub) => sub.progress > best.progress ? sub : best, subjectProgress[0]);
    const worstSubject = subjectProgress.reduce((worst, sub) => sub.progress < worst.progress ? sub : worst, subjectProgress[0]);
    const bestHour = hourlyData.reduce((best, h) => h.productivity > best.productivity ? h : best, hourlyData[0]);
    
    newInsights.push({
      type: 'success',
      title: 'Melhor desempenho',
      description: `${bestSubject.subject} é sua matéria com maior progresso (${bestSubject.progress}%)`,
      icon: <FaTrophy />
    });
    newInsights.push({
      type: 'warning',
      title: 'Área de foco',
      description: `${worstSubject.subject} precisa de mais atenção (${worstSubject.progress}%)`,
      icon: <FaBrain />
    });
    newInsights.push({
      type: 'info',
      title: 'Horário produtivo',
      description: `Você é mais produtivo por volta das ${bestHour.hour}`,
      icon: <FaClock />
    });
    
    setInsights(newInsights);
  };

  // Dados de evolução (simulados baseados no tempo)
  const evolutionData = [
    { week: 'Sem 1', hours: 12, progress: 45, retention: 70 },
    { week: 'Sem 2', hours: 18, progress: 55, retention: 75 },
    { week: 'Sem 3', hours: 24, progress: 65, retention: 78 },
    { week: 'Sem 4', hours: 30, progress: 72, retention: 82 },
    { week: 'Sem 5', hours: 35, progress: 78, retention: 85 },
    { week: 'Sem 6', hours: 42, progress: 82, retention: 87 },
  ];

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">{title}</span>
        <span className={`text-${color}-500 text-xl`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  const InsightCard = ({ insight }) => {
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-700',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700'
    };
    return (
      <div className={`p-3 rounded-lg border ${colors[insight.type]}`}>
        <div className="flex items-center gap-2">
          <div className="text-lg">{insight.icon}</div>
          <p className="font-medium text-sm">{insight.title}</p>
        </div>
        <p className="text-xs opacity-80 mt-1">{insight.description}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} userData={userData} />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🧠 Mapa Cognitivo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Visualize seu desempenho acadêmico e descubra padrões de estudo
              </p>
            </motion.div>

            {/* Time Range Selector */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'week', label: 'Semana' },
                { id: 'month', label: 'Mês' },
                { id: 'year', label: 'Ano' }
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Total Horas" 
                value={`${userData?.stats?.totalStudyHours || 0}h`} 
                icon={<FaClock />} 
                color="blue"
                subtitle={`+${Math.round((userData?.stats?.totalStudyHours || 0) / 10)}% este mês`}
              />
              <StatCard 
                title="Sequência" 
                value={`${userData?.stats?.currentStreak || 0} dias`} 
                icon={<FaFire />} 
                color="orange"
                subtitle={`Recorde: ${userData?.stats?.longestStreak || 0}`}
              />
              <StatCard 
                title="Dias Estudados" 
                value={userData?.stats?.studySessions || 0} 
                icon={<FaCalendarAlt />} 
                color="green"
              />
              <StatCard 
                title="Média Geral" 
                value={`${Math.round(subjectData.reduce((acc, s) => acc + s.progress, 0) / subjectData.length)}%`} 
                icon={<FaChartLine />} 
                color="purple"
              />
            </div>

            {/* Chart Type Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'progress', label: 'Progresso por Matéria', icon: <FaChartBar /> },
                { id: 'evolution', label: 'Evolução Temporal', icon: <FaChartLine /> },
                { id: 'productivity', label: 'Produtividade', icon: <FaChartScatter /> },
                { id: 'radar', label: 'Radar de Competências', icon: <FaBrain /> }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    chartType === type.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>

            {/* Gráfico Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {chartType === 'progress' && '📊 Progresso por Matéria'}
                {chartType === 'evolution' && '📈 Evolução do Aprendizado'}
                {chartType === 'productivity' && '⏰ Produtividade por Horário'}
                {chartType === 'radar' && '🎯 Radar de Competências'}
              </h2>
              
              <div className="h-[400px]">
                {chartType === 'progress' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="progress" fill="#8b5cf6" radius={[10, 10, 0, 0]} name="Progresso (%)">
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'evolution' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis yAxisId="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="progress" stroke="#8b5cf6" strokeWidth={2} name="Progresso (%)" />
                      <Line yAxisId="left" type="monotone" dataKey="retention" stroke="#ec4899" strokeWidth={2} name="Retenção (%)" />
                      <Line yAxisId="right" type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={2} name="Horas" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'productivity' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="productivity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Produtividade (%)" />
                      <Area type="monotone" dataKey="studies" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name="Sessões" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'radar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius="80%" data={performanceData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Desempenho" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Insights e Análises */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {insights.map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
            </div>

            {/* Horários Mais Produtivos */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaClock className="text-purple-500" /> Horários Mais Produtivos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData.filter((_, i) => i % 3 === 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="productivity" fill="#8b5cf6" radius={[5, 5, 0, 0]} name="Produtividade" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Recomendações</h3>
                  {hourlyData
                    .sort((a, b) => b.productivity - a.productivity)
                    .slice(0, 3)
                    .map((hour, idx) => (
                      <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="font-medium text-purple-700 dark:text-purple-300">
                          🌟 Horário {hour.hour}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Produtividade: {hour.productivity}% • ideal para estudos complexos
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Progresso Semanal */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaCalendarWeek className="text-purple-500" /> Distribuição Semanal de Estudo
              </h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="hours" fill="#8b5cf6" radius={[5, 5, 0, 0]} name="Horas" />
                    <Bar yAxisId="right" dataKey="productivity" fill="#f59e0b" radius={[5, 5, 0, 0]} name="Produtividade (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const AntiProcrastination = ({ user }) => {
  // Timer Pomodoro
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);
  
  // Metas
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [dailyGoal, setDailyGoal] = useState(4); // pomodoros por dia
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  // Estatísticas
  const [userData, setUserData] = useState(null);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [blockedDistractions, setBlockedDistractions] = useState(false);
  
  // Modos
  const modes = {
    pomodoro: { label: 'Foco', time: 25 * 60, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20' },
    shortBreak: { label: 'Pausa Curta', time: 5 * 60, color: '#10b981', bg: 'bg-green-50 dark:bg-green-900/20' },
    longBreak: { label: 'Pausa Longa', time: 15 * 60, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' }
  };

  // Buscar dados do usuário
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      const result = await getFullUserData(user.uid);
      if (result.success) {
        setUserData(result.data);
        setTotalFocusMinutes(result.data.stats?.totalStudyHours * 60 || 0);
      }
    };
    fetchData();
    
    // Carregar metas salvas
    const savedGoals = localStorage.getItem('scholaros_goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
    const savedPomodoros = localStorage.getItem('scholaros_pomodoros');
    if (savedPomodoros) {
      setCompletedPomodoros(parseInt(savedPomodoros));
    }
  }, [user]);

  // Salvar metas
  useEffect(() => {
    localStorage.setItem('scholaros_goals', JSON.stringify(goals));
  }, [goals]);
  
  useEffect(() => {
    localStorage.setItem('scholaros_pomodoros', completedPomodoros.toString());
  }, [completedPomodoros]);

  // Timer
  useEffect(() => {
    if (timerMode === 'pomodoro') {
      setTimeLeft(modes.pomodoro.time);
    } else if (timerMode === 'shortBreak') {
      setTimeLeft(modes.shortBreak.time);
    } else {
      setTimeLeft(modes.longBreak.time);
    }
  }, [timerMode]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearTimeout(timerRef.current);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-988.mp3');
      audio.play();
    }
    toast.success(`${modes[timerMode].label} finalizado!`);
    
    if (timerMode === 'pomodoro') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      setCompletedPomodoros(prev => prev + 1);
      setTotalFocusMinutes(prev => prev + 25);
      
      // Registrar XP
      if (newSessions % 4 === 0) {
        setTimerMode('longBreak');
        toast.success('🎉 Ciclo completo! Faça uma pausa longa!');
      } else {
        setTimerMode('shortBreak');
      }
    } else {
      setTimerMode('pomodoro');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setTimerMode('pomodoro');
    setTimeLeft(modes.pomodoro.time);
  };

  // Metas
  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, { id: Date.now(), text: newGoal, completed: false, createdAt: new Date().toISOString() }]);
      setNewGoal('');
      toast.success('Meta adicionada!');
    }
  };

  const toggleGoal = (id) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
    toast.success('Meta removida');
  };

  const completeDailyGoal = async () => {
    if (completedPomodoros >= dailyGoal) {
      const xpGain = 100;
      toast.success(`🎉 Meta diária concluída! +${xpGain} XP!`);
      await updateUserData(user.uid, {
        'stats.currentXP': (userData?.stats?.currentXP || 0) + xpGain,
        'stats.completedGoals': (userData?.stats?.completedGoals || 0) + 1
      });
    }
  };

  useEffect(() => {
    completeDailyGoal();
  }, [completedPomodoros]);

  // Bloqueio de distrações (simulado)
  const toggleBlockDistractions = () => {
    setBlockedDistractions(!blockedDistractions);
    toast[!blockedDistractions ? 'success' : 'info'](
      !blockedDistractions ? '🚫 Modo foco ativado! Distrações bloqueadas.' : '🔓 Modo normal'
    );
  };

  const pomodoroProgress = (completedPomodoros / dailyGoal) * 100;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ⚡ Sistema Anti-Procrastinação
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Foque, estude e atinja suas metas com o método Pomodoro
              </p>
            </motion.div>

            {/* Bloqueio de Distrações */}
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleBlockDistractions}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  blockedDistractions
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {blockedDistractions ? <FaLock /> : <FaUnlock />}
                {blockedDistractions ? 'Modo Foco Ativo' : 'Ativar Modo Foco'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timer Pomodoro */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
                  <div className="flex gap-2 justify-center mb-6">
                    {Object.entries(modes).map(([key, mode]) => (
                      <button
                        key={key}
                        onClick={() => { setTimerMode(key); setIsActive(false); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          timerMode === key
                            ? 'text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        style={timerMode === key ? { backgroundColor: mode.color } : {}}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-7xl font-mono font-bold mb-6 text-gray-800 dark:text-white">
                    {formatTime(timeLeft)}
                  </div>
                  
                  <div className="flex gap-3 justify-center mb-6">
                    {!isActive ? (
                      <button
                        onClick={startTimer}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700 transition-all"
                      >
                        <FaPlay /> Iniciar
                      </button>
                    ) : (
                      <button
                        onClick={pauseTimer}
                        className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-yellow-700 transition-all"
                      >
                        <FaPause /> Pausar
                      </button>
                    )}
                    <button
                      onClick={resetTimer}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-600 transition-all"
                    >
                      <FaRedo /> Reset
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSoundEnabled(!soundEnabled)}>
                        {soundEnabled ? <FaVolumeUp className="text-gray-600" /> : <FaVolumeMute className="text-gray-400" />}
                      </button>
                      <span className="text-sm text-gray-500">Sons</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ciclos completos: {sessions}</p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas de Foco */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
                    <FaClock className="text-purple-500 text-2xl mx-auto mb-2" />
                    <p className="text-2xl font-bold">{Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</p>
                    <p className="text-sm text-gray-500">Tempo focado total</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
                    <FaFire className="text-orange-500 text-2xl mx-auto mb-2" />
                    <p className="text-2xl font-bold">{completedPomodoros}</p>
                    <p className="text-sm text-gray-500">Pomodoros completos</p>
                  </div>
                </div>
              </div>

              {/* Metas e Tarefas */}
              <div>
                {/* Meta Diária */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-lg text-white mb-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <FaBrain /> Meta Diária
                  </h3>
                  <div className="text-center mb-3">
                    <p className="text-3xl font-bold">{completedPomodoros}/{dailyGoal}</p>
                    <p className="text-sm opacity-80">Pomodoros concluídos</p>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                    <div 
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${pomodoroProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center opacity-80">Meta: {dailyGoal} pomodoros por dia</p>
                </div>

                {/* Lista de Metas */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FaCheckCircle /> Minhas Metas
                  </h3>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                      placeholder="Nova meta..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    />
                    <button
                      onClick={addGoal}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {goals.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhuma meta adicionada. Comece pequeno!
                      </p>
                    ) : (
                      goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group hover:shadow-md transition-all"
                        >
                          <button onClick={() => toggleGoal(goal.id)}>
                            {goal.completed ? (
                              <FaCheckCircle className="text-green-500 text-xl" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                            )}
                          </button>
                          <span className={`flex-1 text-gray-800 dark:text-white ${goal.completed ? 'line-through text-gray-400' : ''}`}>
                            {goal.text}
                          </span>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="opacity-0 group-hover:opacity-100 transition-all text-red-500 hover:text-red-600"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 text-center">
                      💡 Complete {dailyGoal} pomodoros para ganhar 100 XP!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendações */}
            <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 shadow-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <FaBell /> Dicas Anti-Procrastinação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">🎯 1.</span>
                  <span>Divida tarefas grandes em pequenas metas diárias</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">⏰ 2.</span>
                  <span>Use o método Pomodoro: 25min foco, 5min pausa</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">🚫 3.</span>
                  <span>Ative o Modo Foco para bloquear distrações</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


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
      <Route path="/groups/:groupId" element={user ? <StudyGroups user={user} /> : <Navigate to="/login" />} />
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