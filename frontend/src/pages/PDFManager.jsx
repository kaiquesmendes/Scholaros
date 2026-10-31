// frontend/src/pages/PDFManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileAlt, FaAward, FaHistory, FaFolderOpen, FaTrash, FaRobot, FaTimes } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PDFUploader from '../components/PDFUploader';
import PDFResult from '../components/PDFResult';
import { getFullUserData, registerPDF } from '../config/firebase';
import { checkBadges } from '../services/badgeService';
import { saveMaterial, listMaterials, deleteMaterial, addCardsFromMaterial } from '../services/studyService';
import toast from 'react-hot-toast';

const StatsCard = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
    <div className="text-2xl mb-2 text-purple-500">{icon}</div>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    <p className="text-xs text-gray-500">{title}</p>
  </div>
);

const PDFManager = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [processingHistory, setProcessingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [opened, setOpened] = useState(null);

  const refreshUser = useCallback(async () => {
    const result = await getFullUserData(user.uid);
    if (result.success) {
      setUserData(result.data);
      setProcessingHistory(result.data.recentPDFs || []);
    }
  }, [user.uid]);

  const refreshMaterials = useCallback(async () => {
    const result = await listMaterials(user.uid);
    if (result.success) setMaterials(result.items);
  }, [user.uid]);

  useEffect(() => {
    refreshUser();
    refreshMaterials();
  }, [refreshUser, refreshMaterials]);

  // Chamada quando um PDF termina de ser processado: XP (com level-up), material salvo,
  // flashcards no baralho de revisão e conquistas.
  const handlePDFProcessed = async (fileName, pages, data) => {
    try {
      // Reprocessar o mesmo arquivo não gera XP, material nem cartões duplicados.
      if (materials.some((m) => m.fileName === fileName && m.pageCount === pages)) {
        toast('Este PDF já está nos seus materiais — sem XP repetido.', { icon: 'ℹ️' });
        return;
      }

      const xp = await registerPDF(user.uid, fileName, pages);
      if (!xp.success) toast.error('Não foi possível registrar o PDF no seu histórico.');

      const saved = await saveMaterial(user.uid, {
        fileName,
        pageCount: pages,
        summary: data.summary,
        flashcards: data.flashcards,
        questions: data.questions,
        mindMap: data.mindMap,
        coveragePercent: data.metadata?.coveragePercent,
      });

      let cardsAdded = 0;
      if (saved.success && data.flashcards?.length) {
        const cards = await addCardsFromMaterial(user.uid, saved.id, fileName, data.flashcards);
        if (cards.success) cardsAdded = cards.added;
      }
      if (!saved.success) toast.error('O material foi gerado, mas não pôde ser salvo.');

      await checkBadges(user.uid);
      await Promise.all([refreshUser(), refreshMaterials()]);

      const parts = [];
      if (xp.success) parts.push(`+${xp.xpGained} XP`);
      if (cardsAdded) parts.push(`${cardsAdded} flashcards na revisão`);
      if (parts.length) toast.success(`📄 ${parts.join(' · ')}`);
    } catch (error) {
      console.error('Erro ao registrar PDF:', error);
    }
  };

  const handleDelete = async (material) => {
    if (!window.confirm(`Excluir "${material.fileName}" e os flashcards dele da revisão?`)) return;
    const result = await deleteMaterial(user.uid, material.id);
    if (result.success) {
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      if (opened?.id === material.id) setOpened(null);
      toast.success('Material excluído');
    } else {
      toast.error('Não foi possível excluir');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    📚 Biblioteca Inteligente
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Transforme seus PDFs em materiais de estudo interativos com IA
                  </p>
                </div>

                <div className="flex gap-3">
                  <StatsCard title="PDFs Processados" value={userData?.stats?.totalPDFsProcessed || 0} icon={<FaFileAlt />} />
                  <StatsCard title="XP Ganho" value={(userData?.stats?.totalPDFsProcessed || 0) * 20} icon={<FaAward />} />
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

            <PDFUploader user={user} onPDFProcessed={handlePDFProcessed} />

            {/* Materiais salvos */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">🗂️ Meus materiais</h2>
              {materials.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Os PDFs que você processar ficam salvos aqui, com resumo, flashcards, questões e mapa mental, para reabrir quando quiser.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {materials.map((m) => (
                    <div key={m.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="font-semibold text-gray-800 dark:text-white truncate" title={m.fileName}>{m.fileName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(m.createdAt).toLocaleDateString('pt-BR')} · {m.pageCount} pág. · {m.flashcards?.length || 0} flashcards · {m.questions?.length || 0} questões
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => setOpened(m)}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-700"
                        >
                          <FaFolderOpen /> Abrir
                        </button>
                        <Link
                          to={`/tutor?material=${m.id}`}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-200"
                        >
                          <FaRobot /> Tirar dúvidas
                        </Link>
                        <button
                          onClick={() => handleDelete(m)}
                          title="Excluir"
                          className="ml-auto text-gray-400 hover:text-red-600"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {opened && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">{opened.fileName}</h3>
                    <button onClick={() => setOpened(null)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                      <FaTimes /> Fechar
                    </button>
                  </div>
                  <PDFResult data={opened} />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PDFManager;
