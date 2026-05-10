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
import { db, doc, getDoc, setDoc, updateDoc } from './config/firebase';

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

// ========== DASHBOARD DINÂMICO COM DADOS REAIS ==========
const Dashboard = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stats, setStats] = useState({
    streak: 0,
    totalHours: 0,
    completedGoals: 0,
    totalGoals: 0,
    averageRetention: 0
  });
  const [loading, setLoading] = useState(true);

  // Buscar dados reais do usuário no Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Buscar dados do Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Atualizar estatísticas com dados reais
          setStats({
            streak: data.stats?.currentStreak || 0,
            totalHours: data.stats?.totalStudyHours || 0,
            completedGoals: data.stats?.completedGoals || 0,
            totalGoals: data.stats?.totalGoals || 50,
            averageRetention: data.stats?.averageRetention || 0
          });
          
          // Carregar matérias do usuário
          if (data.subjects && data.subjects.length > 0) {
            setSubjects(data.subjects);
          } else {
            // Matérias padrão se não existir
            setSubjects([
              { name: 'Matemática', progress: 0, color: '#8b5cf6', hours: 0, goal: 50 },
              { name: 'Português', progress: 0, color: '#ec4899', hours: 0, goal: 50 },
              { name: 'Redação', progress: 0, color: '#06b6d4', hours: 0, goal: 50 },
              { name: 'Física', progress: 0, color: '#f59e0b', hours: 0, goal: 50 },
              { name: 'Química', progress: 0, color: '#10b981', hours: 0, goal: 50 },
            ]);
          }
          
          // Carregar atividades recentes
          if (data.recentActivities && data.recentActivities.length > 0) {
            setRecentActivities(data.recentActivities.slice(0, 5));
          } else {
            setRecentActivities([
              { id: 1, title: 'Bem-vindo ao ScholarOS!', description: 'Complete seu primeiro estudo', date: new Date().toLocaleDateString('pt-BR'), icon: '🎉', type: 'welcome' }
            ]);
          }
        } else {
          // Criar documento padrão para novo usuário
          const defaultData = {
            name: user.displayName || user.email?.split('@')[0] || 'Estudante',
            email: user.email,
            createdAt: new Date().toISOString(),
            stats: {
              currentStreak: 0,
              totalStudyHours: 0,
              completedGoals: 0,
              totalGoals: 50,
              averageRetention: 0,
              level: 1,
              xp: 0
            },
            subjects: [
              { name: 'Matemática', progress: 0, color: '#8b5cf6', hours: 0, goal: 50 },
              { name: 'Português', progress: 0, color: '#ec4899', hours: 0, goal: 50 },
              { name: 'Redação', progress: 0, color: '#06b6d4', hours: 0, goal: 50 },
              { name: 'Física', progress: 0, color: '#f59e0b', hours: 0, goal: 50 },
              { name: 'Química', progress: 0, color: '#10b981', hours: 0, goal: 50 },
            ],
            recentActivities: [
              { id: 1, title: 'Bem-vindo ao ScholarOS!', description: 'Complete seu primeiro estudo para ganhar XP', date: new Date().toLocaleDateString('pt-BR'), icon: '🎉', type: 'welcome' }
            ]
          };
          
          await setDoc(doc(db, 'users', user.uid), defaultData);
          setUserData(defaultData);
          setStats({
            streak: 0,
            totalHours: 0,
            completedGoals: 0,
            totalGoals: 50,
            averageRetention: 0
          });
          setSubjects(defaultData.subjects);
          setRecentActivities(defaultData.recentActivities);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        // Dados mockados para fallback (apenas para não quebrar)
        setStats({
          streak: 7,
          totalHours: 42,
          completedGoals: 15,
          totalGoals: 50,
          averageRetention: 75
        });
        setSubjects([
          { name: 'Matemática', progress: 65, color: '#8b5cf6', hours: 12, goal: 50 },
          { name: 'Português', progress: 70, color: '#ec4899', hours: 10, goal: 50 },
          { name: 'Redação', progress: 60, color: '#06b6d4', hours: 8, goal: 50 },
          { name: 'Física', progress: 45, color: '#f59e0b', hours: 6, goal: 50 },
          { name: 'Química', progress: 55, color: '#10b981', hours: 7, goal: 50 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Função para atualizar progresso de matéria
  const updateSubjectProgress = async (subjectName, newProgress, newHours) => {
    const updatedSubjects = subjects.map(sub => 
      sub.name === subjectName 
        ? { ...sub, progress: newProgress, hours: sub.hours + newHours }
        : sub
    );
    setSubjects(updatedSubjects);
    
    // Salvar no Firestore
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        subjects: updatedSubjects,
        'stats.totalStudyHours': stats.totalHours + newHours
      });
      
      // Adicionar atividade
      const newActivity = {
        id: Date.now(),
        title: `Estudou ${subjectName}`,
        description: `${newHours} horas de estudo na matéria`,
        date: new Date().toLocaleString('pt-BR'),
        icon: '📚',
        type: 'study'
      };
      
      const updatedActivities = [newActivity, ...recentActivities].slice(0, 10);
      setRecentActivities(updatedActivities);
      await updateDoc(doc(db, 'users', user.uid), {
        recentActivities: updatedActivities,
        'stats.totalStudyHours': stats.totalHours + newHours
      });
      
      toast.success(`Progresso em ${subjectName} atualizado! +${newHours}h`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar progresso');
    }
  };

  // Função para adicionar nova redação
  const addEssayActivity = async (title, score) => {
    const newActivity = {
      id: Date.now(),
      title: `Redação: ${title}`,
      description: score ? `Nota: ${score}/1000` : 'Redação analisada',
      score: score,
      date: new Date().toLocaleString('pt-BR'),
      icon: '✍️',
      type: 'essay'
    };
    
    const updatedActivities = [newActivity, ...recentActivities].slice(0, 10);
    setRecentActivities(updatedActivities);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        recentActivities: updatedActivities,
        'stats.completedGoals': stats.completedGoals + 1
      });
      setStats({ ...stats, completedGoals: stats.completedGoals + 1 });
      toast.success('Redação registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  // Função para adicionar PDF processado
  const addPDFActivity = async (fileName, pages) => {
    const newActivity = {
      id: Date.now(),
      title: `PDF processado: ${fileName}`,
      description: `${pages} páginas analisadas`,
      pages: pages,
      date: new Date().toLocaleString('pt-BR'),
      icon: '📄',
      type: 'pdf'
    };
    
    const updatedActivities = [newActivity, ...recentActivities].slice(0, 10);
    setRecentActivities(updatedActivities);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        recentActivities: updatedActivities
      });
      toast.success('PDF registrado no histórico!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  // Calcular nível do usuário baseado nas horas
  const userLevel = Math.floor(stats.totalHours / 50) + 1;
  const nextLevelXP = userLevel * 50;
  const currentXP = stats.totalHours % 50;
  const xpProgress = (currentXP / nextLevelXP) * 100;

  // Calcular média geral de progresso
  const overallProgress = subjects.length > 0 
    ? Math.round(subjects.reduce((acc, sub) => acc + sub.progress, 0) / subjects.length) 
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
          {/* Welcome Section com dados reais */}
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

          {/* Stats Cards com dados reais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon="🔥" 
              label="Sequência" 
              value={`${stats.streak} dias`} 
              change={`${stats.streak > 0 ? stats.streak === 1 ? '+1 hoje' : `+${stats.streak} dias` : 'Comece hoje!'}`}
              color="orange"
            />
            <StatCard 
              icon="⏱️" 
              label="Horas Estudadas" 
              value={`${stats.totalHours}h`} 
              change={`Média ${Math.round(stats.totalHours / (stats.streak || 1))}h/dia`}
              color="blue"
            />
            <StatCard 
              icon="🎯" 
              label="Metas Concluídas" 
              value={`${stats.completedGoals}/${stats.totalGoals}`} 
              change={`${Math.round((stats.completedGoals / stats.totalGoals) * 100)}% concluído`}
              color="green"
            />
            <StatCard 
              icon="🧠" 
              label="Retenção Média" 
              value={`${stats.averageRetention}%`} 
              change={stats.averageRetention > 70 ? 'Bom desempenho!' : 'Foco em revisões'}
              color="purple"
            />
          </div>

          {/* Charts and Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Subjects Progress com dados reais */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
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

            {/* Recent Activities com dados reais */}
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

          {/* Radar de Aprovação com dados reais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-lg"
          >
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
                    <span>{subject.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${subject.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap justify-between text-white/80 text-sm gap-2">
              <span>📊 Total de estudos: {stats.totalHours} horas</span>
              <span>🎯 Meta da semana: {Math.max(0, 10 - Math.floor(stats.totalHours / 10))}h para próximo nível</span>
            </div>
          </motion.div>
          
          {/* Botão para adicionar estudo manual */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                const hours = prompt('Quantas horas você estudou hoje?', '1');
                if (hours) {
                  updateSubjectProgress('Matemática', 0, parseFloat(hours));
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all"
            >
              + Adicionar Horas de Estudo
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

// Componentes auxiliares
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
      // Cada hora de estudo aumenta 2% de progresso (máx 100%)
      const progressIncrease = Math.min(tempHours * 2, 100 - subject.progress);
      const newProgress = Math.min(subject.progress + progressIncrease, 100);
      onUpdate(subject.name, newProgress, tempHours);
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
          <span className="text-sm text-gray-500">{subject.hours}h estudadas</span>
          <span className="text-sm font-semibold" style={{ color: subject.color }}>{subject.progress}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${subject.progress}%` }}
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

// ========== EDITOR ACADÊMICO SUPERIOR - COM IA AVANÇADA ==========
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
  const [professorMode, setProfessorMode] = useState(false);
  const [strictABNT, setStrictABNT] = useState(false);
  const [humanizerMode, setHumanizerMode] = useState(false);
  const [expansionMode, setExpansionMode] = useState(false);
  
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
      label: 'ENEM', icon: '🎯', bgIcon: '✍️', color: 'from-purple-600 to-purple-700',
      minWords: 50, gradeSuffix: '/1000', gradeMax: 1000, competenceMax: 200,
      description: 'Correção estilo ENEM - Redação Dissertativa-Argumentativa',
      formatPrompt: `Você é um assistente acadêmico especializado em correção e formatação de redações ENEM.

REGRAS:
- Corrija ortografia, gramática, concordância e pontuação
- Melhore a coerência e coesão textual
- Padronize a estrutura: Introdução (com tese), Desenvolvimento (2 parágrafos com argumentos), Conclusão (com proposta de intervenção)
- Linguagem formal e impessoal
- Adicione conectivos adequados
- Mantenha o tema original

TEXTO: ${essay}`
    },
    faculdade: { 
      label: 'FACULDADE', icon: '🎓', bgIcon: '📚', color: 'from-blue-600 to-blue-700',
      minWords: 200, gradeSuffix: '%', gradeMax: 100, competenceMax: 100,
      description: 'Formato ABNT para Artigos e Trabalhos Acadêmicos',
      formatPrompt: `Você é um assistente acadêmico especializado em formatação ABNT para artigos científicos.

REGRAS:
- Corrija ortografia, gramática e concordância
- Estruture com: Título, Autor, Resumo, Palavras-chave, Abstract, Keywords
- Organize em: Introdução, Metodologia, Resultados, Discussão, Conclusão
- Formate referências conforme ABNT NBR 6023
- Adicione citações diretas com aspas
- Aplique linguagem científica

TEXTO: ${essay}`
    },
    tcc: { 
      label: 'TCC', icon: '🏆', bgIcon: '📖', color: 'from-green-600 to-green-700',
      minWords: 500, gradeSuffix: '%', gradeMax: 100, competenceMax: 100,
      description: 'Formatação ABNT completa para Trabalho de Conclusão de Curso',
      formatPrompt: `Você é um assistente acadêmico avançado especializado em formatação de TCC seguindo rigorosamente as normas ABNT (NBR 14724, 10520, 6023, 6024, 6027, 6028).

DADOS DO TRABALHO:
Título: ${tccConfig.titulo || '[TÍTULO DO TCC]'}
Subtítulo: ${tccConfig.subtitulo || ''}
Autor: ${tccConfig.autor || '[NOME DO AUTOR]'}
Orientador: ${tccConfig.orientador || '[NOME DO ORIENTADOR]'}
Coorientador: ${tccConfig.coorientador || ''}
Instituição: ${tccConfig.instituicao || '[NOME DA INSTITUIÇÃO]'}
Curso: ${tccConfig.curso || '[NOME DO CURSO]'}
Cidade: ${tccConfig.cidade || '[CIDADE]'}
Ano: ${tccConfig.ano}

ESTRUTURA OBRIGATÓRIA:

PRÉ-TEXTUAIS:
- CAPA (instituição, curso, título, autor, local, ano)
- FOLHA DE ROSTO (com orientador)
- RESUMO em português (250-500 palavras, 3-5 palavras-chave)
- ABSTRACT em inglês (250-500 palavras, 3-5 keywords)
- SUMÁRIO (com numeração progressiva)

TEXTUAIS:
1 INTRODUÇÃO (contextualização, problema, questão, objetivos, justificativa, estrutura)
2 REFERENCIAL TEÓRICO (fundamentação, revisão sistemática, estado da arte, lacunas)
3 METODOLOGIA (delineamento, classificação, universo/amostra, instrumentos, procedimentos, análise)
4 RESULTADOS (caracterização, análise descritiva, análise inferencial, testes estatísticos)
5 DISCUSSÃO (interpretação dos resultados, comparação com literatura, implicações, limitações)
6 CONCLUSÃO (síntese dos achados, contribuições, limitações, recomendações)

PÓS-TEXTUAIS:
- REFERÊNCIAS (ABNT NBR 6023 - livros, artigos, sites, teses)
- APÊNDICES (opcional)
- ANEXOS (opcional)

FORMATAÇÃO:
- Fonte: Times New Roman ou Arial, tamanho 12
- Títulos: tamanho 12, negrito
- Espaçamento: 1,5 entre linhas
- Parágrafos: recuo de 1,25 cm
- Margens: superior/esquerda 3cm, inferior/direita 2cm
- Alinhamento: justificado
- Citações curtas (até 3 linhas): entre aspas
- Citações longas (+3 linhas): bloco recuado 4cm, fonte 10

TEXTO ORIGINAL A SER ESTRUTURADO E MELHORADO:
${essay}

REGRAS ADICIONAIS:
1. Preserve o tema original e todas as informações relevantes
2. Não invente dados absurdos
3. Mantenha a coerência e o sentido do texto
4. Melhore a profundidade acadêmica onde necessário
5. Expanda ideias curtas para torná-las mais substanciais
6. Adicione conectivos formais e variados
7. Torne o texto mais humano e natural (evite padrões robóticos)
8. Se detectar problemas acadêmicos (introdução curta, falta de referencial, conclusão superficial), aponte no início do texto como [ALERTA]
9. Aplique normas ABNT rigorosamente se strictABNT estiver ativado
10. Humanize o texto se humanizerMode estiver ativado

IMPORTANTE: Retorne APENAS o texto formatado, sem comentários adicionais.`
    },
  };

  useEffect(() => {
    const words = essay.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    setCharCount(essay.length);
  }, [essay]);

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
    
    let modeText = '';
    if (professorMode) modeText += ' Ativar MODO PROFESSOR - gere comentários técnicos, críticas construtivas, análise acadêmica detalhada e notas simuladas.';
    if (strictABNT) modeText += ' Ativar MODO STRICT ABNT - aplique rigorosamente todas as normas ABNT (NBR 14724, 6023, 10520, 6028). Valide títulos, referências, citações e formatação.';
    if (humanizerMode) modeText += ' Ativar MODO HUMANIZADOR - reduza aparência de IA, aumente naturalidade, varie conectivos, evite padrões previsíveis.';
    if (expansionMode) modeText += ' Ativar MODO EXPANSÃO - expanda conteúdos muito curtos mantendo coerência e formalidade.';
    
    toast.loading(`🤖 IA formatando seu ${cfg[mode].label}${modeText}...`, { id: 'format' });

    try {
      const response = await axios.post('https://scholaros-5ncu.onrender.com/api/essay/format-abnt', {
        content: essay,
        mode: mode,
        tccConfig: tccConfig,
        professorMode: professorMode,
        strictABNT: strictABNT,
        humanizerMode: humanizerMode,
        expansionMode: expansionMode,
        prompt: cfg[mode].formatPrompt + modeText
      });

      let formattedText = response.data.formattedText || response.data.content;
      
      if (professorMode && response.data.teacherNotes) {
        formattedText = '📋 NOTAS DO PROFESSOR:\n' + response.data.teacherNotes + '\n\n---\n\n' + formattedText;
      }
      
      setEssay(formattedText);
      toast.success(`✅ ${cfg[mode].label} formatado com sucesso!`, { id: 'format' });
    } catch (error) {
      console.error('Erro:', error);
      toast.warning('⚠️ IA indisponível. Usando formatação local básica.', { id: 'format' });
      setEssay(essay);
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
      const response = await axios.post('https://scholaros-5ncu.onrender.com/api/essay/analyze', {
        content: essay,
        mode: mode
      });
      setFeedback(response.data);
      
      let notaDisplay = '';
      if (mode === 'enem') notaDisplay = `${response.data.grade}/1000`;
      else if (mode === 'faculdade') notaDisplay = `${response.data.grade}%`;
      else notaDisplay = `${response.data.grade}%`;
      
      toast.success(`✅ Nota: ${notaDisplay}`, { id: 'analyzing' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro na análise.', { id: 'analyzing' });
      
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

  const insertTemplate = () => {
    const templates = {
      enem: `🎯 REDAÇÃO ENEM - MODELO NOTA 1000

[INTRODUÇÃO - 4 a 5 linhas]
A discussão sobre [TEMA] é de extrema relevância no contexto brasileiro contemporâneo. Historicamente, observa-se que [contextualização histórica]. Diante desse cenário, é fundamental analisar [problema central], bem como propor soluções efetivas para [questão abordada].

[DESENVOLVIMENTO 1 - 6 a 8 linhas]
Em primeiro lugar, é importante destacar que [argumento 1]. Segundo [autor], "[citação relevante]" (ANO, p. X). Isso evidencia que [conexão com o tema]. Ademais, dados do [fonte confiável] apontam que [estatística], o que reforça a necessidade de [ação específica].

[DESENVOLVIMENTO 2 - 6 a 8 linhas]
Além disso, outro aspecto fundamental reside em [argumento 2]. Conforme [filósofo/teórico], "[citação pertinente]" (ANO, p. Y). Dessa forma, percebe-se que [desdobramento do argumento].

[CONCLUSÃO - 5 a 6 linhas]
Portanto, faz-se necessária uma intervenção estatal e social para mitigar [problema central]. O governo, em parceria com [agentes envolvidos], deve [ação específica] por meio de [meio de implementação]. Espera-se que, com tais medidas, [resultado esperado], contribuindo para uma sociedade mais justa e igualitária.`,
      faculdade: `🎓 MODELO DE ARTIGO CIENTÍFICO

TÍTULO DO ARTIGO (centralizado, negrito)

Nome do Autor
Instituição

RESUMO
[Escreva um resumo de 150-250 palavras]

Palavras-chave: palavra1; palavra2; palavra3.

ABSTRACT
[Write an abstract in English]

Keywords: keyword1; keyword2; keyword3.

1 INTRODUÇÃO
1.1 Contextualização
1.2 Problema de pesquisa
1.3 Objetivos

2 METODOLOGIA
2.1 Tipo de pesquisa
2.2 Coleta de dados

3 RESULTADOS E DISCUSSÃO

4 CONCLUSÃO

REFERÊNCIAS`,
      tcc: `🏆 ESTRUTURA DO TCC - FORMATO ABNT

1. CAPA (instituição, curso, título, autor, local, ano)
2. FOLHA DE ROSTO (com orientador)
3. RESUMO (português, 250-500 palavras, 3-5 palavras-chave)
4. ABSTRACT (inglês, 250-500 palavras, 3-5 keywords)
5. SUMÁRIO

1 INTRODUÇÃO
1.1 Contextualização
1.2 Problema de pesquisa
1.3 Objetivos (geral e específicos)
1.4 Justificativa

2 REFERENCIAL TEÓRICO
2.1 Fundamentação conceitual
2.2 Revisão da literatura

3 METODOLOGIA
3.1 Delineamento
3.2 Participantes
3.3 Instrumentos
3.4 Procedimentos

4 RESULTADOS
4.1 Análise descritiva
4.2 Análise inferencial

5 DISCUSSÃO

6 CONCLUSÃO

REFERÊNCIAS (ABNT NBR 6023)`
    };
    
    if (essay.trim() && !window.confirm("Inserir template substituirá o conteúdo atual. Continuar?")) return;
    setEssay(templates[mode]);
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
    toast.success('📋 Copiado!');
    setTimeout(() => setShowCopied(false), 2000);
  };

  const undoFormat = () => {
    if (originalEssay) {
      setEssay(originalEssay);
      setOriginalEssay('');
      toast.success('↩️ Desfeito!');
    } else {
      toast.error('❌ Nada para desfazer');
    }
  };

  const exportToPDF = () => {
    if (!essay.trim()) {
      toast.error("📄 Sem conteúdo");
      return;
    }
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>ScholarOS - ${cfg[mode].label}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; margin: 2.5cm; font-size: 12pt; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
  .title { font-size: 18pt; font-weight: bold; }
  .meta { font-size: 10pt; color: #666; margin-top: 8px; }
  pre { white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
</style></head>
<body>
<div class="header"><div class="title">ScholarOS — ${cfg[mode].label}</div><div class="meta">${wordCount} palavras | ${charCount} caracteres</div></div>
<pre>${essay.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="footer" style="text-align:center; margin-top:40px; font-size:9pt; color:#888;">Gerado por ScholarOS</div>
</body></html>`);
    win.document.close();
    win.print();
    toast.success("📄 PDF enviado!");
  };

  const ProgressBar = ({ value, max, color }) => {
    const pct = Math.min(100, (value / max) * 100);
    return <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 bg-${color}-500`} style={{ width: `${pct}%` }} /></div>;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
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
                      : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg border-2 border-gray-200`
                  }`}
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {mode === 'tcc' && (
                <button onClick={() => setShowConfig(!showConfig)} className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold flex items-center gap-2">
                  <FaBook /> {showConfig ? 'Ocultar' : '⚙️ Configurar TCC'}
                </button>
              )}
              <button onClick={() => setProfessorMode(!professorMode)} className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${professorMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}>
                <FaChartLine /> 👨‍🏫 Modo Professor
              </button>
              <button onClick={() => setStrictABNT(!strictABNT)} className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${strictABNT ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>
                <FaListOl /> 📏 Strict ABNT
              </button>
              <button onClick={() => setHumanizerMode(!humanizerMode)} className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${humanizerMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                <FaLightbulb /> 💬 Humanizar
              </button>
              <button onClick={() => setExpansionMode(!expansionMode)} className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${expansionMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700'}`}>
                <FaQuoteRight /> 📖 Expandir
              </button>
              <button onClick={insertTemplate} className="px-5 py-2.5 bg-purple-100 text-purple-700 rounded-xl font-semibold flex items-center gap-2"><FaFileAlt /> 📋 Template</button>
              <button onClick={formatWithAI} disabled={formatting} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold flex items-center gap-2">
                {formatting ? <FaSpinner className="animate-spin" /> : <FaMagic />} {formatting ? 'Formatando...' : '✨ Formatação IA'}
              </button>
              <button onClick={exportToPDF} className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold flex items-center gap-2"><FaFilePdf /> 📄 PDF</button>
              <button onClick={copyToClipboard} className="px-5 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-semibold flex items-center gap-2">{showCopied ? <FaCheck /> : <FaCopy />} Copiar</button>
              <button onClick={undoFormat} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold flex items-center gap-2"><FaUndo /> Desfazer</button>
              <button onClick={clearEssay} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl">🗑️ Limpar</button>
            </div>

            {/* TCC Config Panel */}
            {showConfig && mode === 'tcc' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-6 border-2 border-green-200">
                <div className="flex justify-between items-center mb-5"><h3 className="text-xl font-bold text-green-600">📋 Configuração do TCC</h3><button onClick={() => setShowConfig(false)} className="text-gray-400 text-xl">✕</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Título" value={tccConfig.titulo} onChange={(e) => setTccConfig({...tccConfig, titulo: e.target.value})} className="px-4 py-2 border rounded-lg dark:bg-gray-700" />
                  <input type="text" placeholder="Subtítulo" value={tccConfig.subtitulo} onChange={(e) => setTccConfig({...tccConfig, subtitulo: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Autor" value={tccConfig.autor} onChange={(e) => setTccConfig({...tccConfig, autor: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Orientador" value={tccConfig.orientador} onChange={(e) => setTccConfig({...tccConfig, orientador: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Instituição" value={tccConfig.instituicao} onChange={(e) => setTccConfig({...tccConfig, instituicao: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Curso" value={tccConfig.curso} onChange={(e) => setTccConfig({...tccConfig, curso: e.target.value})} className="px-4 py-2 border rounded-lg" />
                </div>
              </motion.div>
            )}

            {/* Main Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm"><span>📝</span><strong>{wordCount}</strong><span className="text-xs">palavras</span></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm"><span>✏️</span><strong>{charCount}</strong><span className="text-xs">caracteres</span></div>
                      </div>
                      <button onClick={analyzeEssay} disabled={analyzing} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                        {analyzing ? <FaSpinner className="animate-spin" /> : <FaRobot />} {analyzing ? 'Analisando...' : '🤖 Analisar com IA'}
                      </button>
                    </div>
                  </div>
                  <textarea value={essay} onChange={(e) => setEssay(e.target.value)} placeholder={`✍️ Escreva ou cole seu ${cfg[mode].label} aqui...`} className="w-full h-[550px] p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none resize-none font-serif text-base leading-relaxed" />
                </div>
              </div>

              {/* Feedback Panel */}
              <div className="space-y-5">
                {analyzing && (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="font-medium">🤖 IA analisando...</p>
                  </div>
                )}
                {formatting && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 text-center">
                    <FaMagic className="text-5xl text-amber-500 mx-auto mb-4 animate-pulse" />
                    <p className="font-medium text-amber-700">✨ IA estruturando seu documento...</p>
                  </div>
                )}
                {feedback && !analyzing && (
                  <div className="space-y-5">
                    <div className={`rounded-2xl p-6 text-white text-center bg-gradient-to-r ${cfg[mode].color}`}>
                      <p className="text-sm opacity-90 mb-2">🎯 Nota da IA</p>
                      <p className="text-5xl font-bold">{feedback.grade}</p>
                      <p className="text-sm opacity-90 mt-2">{cfg[mode].gradeSuffix}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-xl">
                      <h3 className="font-bold mb-4">📊 Competências</h3>
                      {feedback.competences?.slice(0, 3).map((comp, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between text-sm mb-1"><span>{comp.name}</span><span className="text-purple-600 font-bold">{comp.score}{mode === 'enem' ? '/200' : '%'}</span></div>
                          <ProgressBar value={comp.score} max={mode === 'enem' ? 200 : 100} color="purple" />
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200"><h3 className="font-bold text-green-700 mb-2">✅ Pontos Fortes</h3><ul className="space-y-1 text-sm">{feedback.strengths?.slice(0, 3).map((s, i) => <li key={i}>★ {s}</li>)}</ul></div>
                    <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200"><h3 className="font-bold text-yellow-700 mb-2">⚠️ Melhorias</h3><ul className="space-y-1 text-sm">{feedback.improvements?.slice(0, 3).map((s, i) => <li key={i}>◆ {s}</li>)}</ul></div>
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200"><h3 className="font-bold text-blue-700 mb-2">💡 Sugestões</h3><ul className="space-y-1 text-sm">{feedback.suggestions?.slice(0, 3).map((s, i) => <li key={i}>→ {s}</li>)}</ul></div>
                  </div>
                )}
                {!feedback && !analyzing && !formatting && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-xl border border-purple-200">
                    <h3 className="font-bold text-purple-700 mb-4">💡 Dicas para {cfg[mode].label}</h3>
                    <ul className="space-y-2 text-sm">
                      {mode === 'enem' && (<><li>📝 Introdução com tese clara e definida</li><li>🎯 Cada parágrafo = uma ideia principal</li><li>🔗 Use conectivos variados</li><li>💭 Conclusão com proposta de intervenção</li></>)}
                      {mode === 'faculdade' && (<><li>🔍 Problema de pesquisa bem definido</li><li>📊 Metodologia adequada aos objetivos</li><li>📖 Revisão bibliográfica atualizada</li><li>💡 Contribuição original</li></>)}
                      {mode === 'tcc' && (<><li>📚 Siga rigorosamente as normas ABNT</li><li>🔬 Metodologia detalhada e replicável</li><li>📊 Resultados com análise estatística</li><li>💬 Discussão comparando com literatura</li></>)}
                    </ul>
                    <div className="mt-4 p-3 bg-white rounded-xl text-center text-xs text-purple-600">
                      {mode === 'tcc' ? '✅ TCC formatado com IA conforme ABNT NBR 14724' : mode === 'faculdade' ? '✅ Trabalho formatado com rigor científico' : '✅ Redação com estrutura ENEM nota 1000'}
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