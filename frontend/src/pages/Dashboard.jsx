import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaFlame, FaClock, FaTarget, FaBrain, 
  FaBook, FaChartLine, FaUsers, FaRocket 
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Dashboard = () => {
  const stats = [
    { icon: <FaFlame className="text-orange-500" />, label: 'Sequência', value: '12 dias', change: '+2 hoje' },
    { icon: <FaClock className="text-blue-500" />, label: 'Horas Estudadas', value: '127h', change: '+4.5h essa semana' },
    { icon: <FaTarget className="text-green-500" />, label: 'Metas Concluídas', value: '34/50', change: '68%' },
    { icon: <FaBrain className="text-purple-500" />, label: 'Retenção Média', value: '82%', change: '+5% esse mês' },
  ];

  const subjects = [
    { name: 'Matemática', progress: 75, color: 'bg-purple-600', hours: 12 },
    { name: 'Português', progress: 82, color: 'bg-pink-600', hours: 10 },
    { name: 'Redação', progress: 68, color: 'bg-blue-600', hours: 8 },
    { name: 'Física', progress: 45, color: 'bg-yellow-600', hours: 15 },
    { name: 'Química', progress: 60, color: 'bg-green-600', hours: 11 },
  ];

  const tasks = [
    { task: 'Revisar capítulo 5 de Matemática', priority: 'Alta', time: '2h' },
    { task: 'Escrever redação modelo ENEM', priority: 'Média', time: '1h' },
    { task: 'Resolver exercícios de Física', priority: 'Baixa', time: '1.5h' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        
        <main className="p-6">
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Olá, Estudante! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Seu progresso acadêmico está evoluindo. Continue assim! 🚀
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl">{stat.icon}</div>
                  <span className="text-sm text-green-500">{stat.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Subjects and Tasks Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Subjects Progress */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Matérias em Andamento
              </h3>
              <div className="space-y-4">
                {subjects.map((subject, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {subject.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {subject.progress}% • {subject.hours}h
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2">
                      <div 
                        className={`${subject.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${subject.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Today's Tasks */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Tarefas de Hoje
              </h3>
              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{task.task}</p>
                        <p className="text-sm text-gray-500">⏱️ {task.time}</p>
                      </div>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      task.priority === 'Alta' ? 'bg-red-100 text-red-700' :
                      task.priority === 'Média' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Radar de Aprovação */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-sm text-white"
          >
            <h3 className="text-lg font-semibold mb-4">🎯 Radar de Aprovação</h3>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold mb-2">78%</div>
              <p className="text-white/80">Nível de Preparação</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Matemática</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Redação</span>
                  <span>68%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-white/80">📊 Matérias críticas: Física e Química</p>
              <p className="text-sm text-white/80">🎯 Meta da semana: +15% em Ciências</p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;