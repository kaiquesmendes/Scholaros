// frontend/src/pages/CognitiveMap.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaCalendarAlt, FaClock, FaBrain, 
  FaFire, FaBook, FaChartBar, FaChartPie, 
  FaTrophy, FaArrowUp, FaArrowDown, FaMinus,
  FaDownload, FaCalendarWeek, FaChartScatter
} from 'react-icons/fa';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getFullUserData } from '../config/firebase';
import toast from 'react-hot-toast';

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

export default CognitiveMap;