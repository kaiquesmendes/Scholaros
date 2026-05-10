// frontend/src/pages/CognitiveMap.jsx (versão simplificada que funciona)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaCalendarAlt, FaClock, FaBrain, 
  FaFire, FaBook, FaChartBar, FaTrophy, FaCalendarWeek
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getFullUserData } from '../config/firebase';
import toast from 'react-hot-toast';

const CognitiveMap = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const result = await getFullUserData(user.uid);
        if (result.success) {
          setUserData(result.data);
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

  const stats = userData?.stats || {};
  const subjects = userData?.subjects || [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} userData={userData} />
        
        <main className="p-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🧠 Mapa Cognitivo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Visualize seu desempenho acadêmico
              </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                <FaClock className="text-blue-500 text-xl mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalStudyHours || 0}h</p>
                <p className="text-xs text-gray-500">Horas Estudadas</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                <FaFire className="text-orange-500 text-xl mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.currentStreak || 0}</p>
                <p className="text-xs text-gray-500">Dias Seguidos</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                <FaChartLine className="text-purple-500 text-xl mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.level || 1}</p>
                <p className="text-xs text-gray-500">Nível</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                <FaTrophy className="text-yellow-500 text-xl mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.currentXP || 0}</p>
                <p className="text-xs text-gray-500">XP Total</p>
              </div>
            </div>

            {/* Progresso por Matéria */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaChartBar className="text-purple-500" /> Progresso por Matéria
              </h2>
              <div className="space-y-4">
                {subjects.map((subject, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{subject.name}</span>
                      <span className="text-purple-600 font-semibold">{subject.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${subject.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{subject.hours || 0} horas estudadas</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Horários Produtivos */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg text-center">
              <FaCalendarWeek className="text-4xl mb-3 mx-auto" />
              <h2 className="text-2xl font-bold mb-2">📈 Em desenvolvimento</h2>
              <p>Gráficos interativos e análises detalhadas em breve!</p>
              <p className="text-sm opacity-80 mt-4">
                Continue estudando para gerar mais dados de progresso
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CognitiveMap;