// frontend/src/pages/AntiProcrastination.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPause, FaStop, FaRedo, FaBell, 
  FaCheckCircle, FaPlus, FaTrash, FaClock,
  FaChartLine, FaFire, FaBrain, FaLock,
  FaUnlock, FaVolumeUp, FaVolumeMute
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getFullUserData, updateStudyStats, updateUserData } from '../config/firebase';
import toast from 'react-hot-toast';

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

export default AntiProcrastination;