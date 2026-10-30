// frontend/src/pages/PDFManager.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFileAlt, FaAward, FaHistory } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PDFUploader from '../components/PDFUploader';
import { getFullUserData, registerPDF } from '../config/firebase';
import { checkBadges } from '../services/badgeService';
import toast from 'react-hot-toast';

const PDFManager = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [processingHistory, setProcessingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const result = await getFullUserData(user.uid);
      if (result.success) {
        setUserData(result.data);
        setProcessingHistory(result.data.recentPDFs || []);
      }
    };
    fetchUserData();
  }, [user]);

  // Função chamada quando um PDF é processado: registra XP (com level-up), histórico e conquistas.
  const handlePDFProcessed = async (fileName, pages) => {
    try {
      const result = await registerPDF(user.uid, fileName, pages);
      if (!result.success) {
        toast.error('Não foi possível registrar o PDF no seu histórico.');
        return;
      }

      await checkBadges(user.uid);

      const fresh = await getFullUserData(user.uid);
      if (fresh.success) {
        setUserData(fresh.data);
        setProcessingHistory(fresh.data.recentPDFs || []);
      }

      toast.success(`📄 +${result.xpGained} XP!`);
    } catch (error) {
      console.error('Erro ao registrar PDF:', error);
    }
  };

  const StatsCard = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
      <div className="text-2xl mb-2 text-purple-500">{icon}</div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500">{title}</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    📚 Biblioteca Inteligente
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Transforme seus PDFs em materiais de estudo interativos com IA
                  </p>
                </div>
                
                {/* Stats */}
                <div className="flex gap-3">
                  <StatsCard 
                    title="PDFs Processados" 
                    value={userData?.stats?.totalPDFsProcessed || 0} 
                    icon={<FaFileAlt />}
                  />
                  <StatsCard 
                    title="XP Ganho" 
                    value={((userData?.stats?.totalPDFsProcessed || 0) * 20)} 
                    icon={<FaAward />}
                  />
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-all"
                  >
                    <FaHistory className="text-2xl text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Histórico</p>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Histórico */}
            {showHistory && processingHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
              >
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">📜 Últimos PDFs Processados</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {processingHistory.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="truncate max-w-[200px]">{item.name}</span>
                      <span className="text-purple-600 font-semibold">+{item.xpGained} XP</span>
                      <span className="text-gray-400 text-xs">{item.date}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PDF Uploader */}
            <PDFUploader user={user} onPDFProcessed={handlePDFProcessed} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PDFManager;