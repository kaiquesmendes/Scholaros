// frontend/src/pages/Review.jsx
// Revisão espaçada dos flashcards: mostra os cartões devidos e reagenda cada um (SM-2).
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLayerGroup, FaCheckCircle, FaFilePdf } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getDeckStats, listDueCards, reviewCard } from '../services/studyService';
import { registerReviewSession } from '../config/firebase';
import { QUALITY, isRemembered, nextReview, formatInterval, retentionPercent } from '../lib/sm2';

const GRADES = [
  { key: '1', label: 'Errei', quality: QUALITY.AGAIN, className: 'bg-red-500 hover:bg-red-600' },
  { key: '2', label: 'Difícil', quality: QUALITY.HARD, className: 'bg-orange-500 hover:bg-orange-600' },
  { key: '3', label: 'Bom', quality: QUALITY.GOOD, className: 'bg-green-500 hover:bg-green-600' },
  { key: '4', label: 'Fácil', quality: QUALITY.EASY, className: 'bg-blue-500 hover:bg-blue-600' },
];

const Review = ({ user }) => {
  const [phase, setPhase] = useState('loading'); // loading | empty | reviewing | summary
  const [deck, setDeck] = useState({ total: 0, due: 0 });
  const [queue, setQueue] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [firstAttempts, setFirstAttempts] = useState({}); // id do cartão -> qualidade da 1ª resposta
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setPhase('loading');
    const [stats, due] = await Promise.all([getDeckStats(user.uid), listDueCards(user.uid)]);
    setDeck({ total: stats.success ? stats.total : 0, due: stats.success ? stats.due : 0 });
    if (!due.success) {
      toast.error('Não foi possível carregar seus cartões.');
      setPhase('empty');
      return;
    }
    setQueue(due.items);
    setFirstAttempts({});
    setFlipped(false);
    setPhase(due.items.length > 0 ? 'reviewing' : 'empty');
  }, [user.uid]);

  useEffect(() => { load(); }, [load]);

  const finish = async (attempts) => {
    const values = Object.values(attempts);
    const total = values.length;
    const remembered = values.filter(isRemembered).length;
    const result = await registerReviewSession(user.uid, { total, remembered });
    setSummary({
      total,
      remembered,
      percent: retentionPercent(remembered, total),
      xp: result.success ? result.xpGained : 0,
    });
    setPhase('summary');
  };

  const answer = useCallback(async (quality) => {
    if (saving || queue.length === 0 || !flipped) return;
    setSaving(true);

    const card = queue[0];
    const saved = await reviewCard(user.uid, card, quality);
    if (!saved.success) toast.error('Não foi possível salvar esta resposta.');

    // Só a primeira resposta de cada cartão na sessão conta para a retenção.
    const attempts = card.id in firstAttempts ? firstAttempts : { ...firstAttempts, [card.id]: quality };
    setFirstAttempts(attempts);

    const rest = queue.slice(1);
    // Cartão esquecido volta ao fim da fila para ser revisto na mesma sessão.
    const nextQueue = isRemembered(quality) ? rest : [...rest, { ...card, ...(saved.next || {}) }];
    setQueue(nextQueue);
    setFlipped(false);
    setSaving(false);

    if (nextQueue.length === 0) await finish(attempts);
  }, [queue, flipped, saving, firstAttempts, user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atalhos: espaço vira o cartão; 1-4 dão a nota.
  useEffect(() => {
    if (phase !== 'reviewing') return undefined;
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else {
        const grade = GRADES.find((g) => g.key === e.key);
        if (grade) answer(grade.quality);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer]);

  const card = queue[0];
  const reviewedCount = Object.keys(firstAttempts).length;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <FaLayerGroup className="text-purple-600" /> Revisão espaçada
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
              Revise os cartões na hora certa: o que você acerta aparece cada vez mais espaçado; o que erra volta logo.
            </p>

            {phase === 'loading' && <p className="text-gray-500">Carregando seus cartões...</p>}

            {phase === 'empty' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
                {deck.total === 0 ? (
                  <>
                    <FaFilePdf className="text-5xl text-purple-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">Seu baralho está vazio</p>
                    <p className="text-sm text-gray-500 mt-2">Processe um PDF e os flashcards dele entram aqui automaticamente.</p>
                    <Link to="/pdfs" className="inline-block mt-5 px-5 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">
                      Ir para os PDFs
                    </Link>
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">Tudo em dia! 🎉</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Nenhum cartão para revisar agora. Você tem {deck.total} cartões no baralho.
                    </p>
                  </>
                )}
              </div>
            )}

            {phase === 'reviewing' && card && (
              <>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{card.source}</span>
                  <span>Restantes: {queue.length} · Revisados: {reviewedCount}</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${card.id}-${flipped}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setFlipped((f) => !f)}
                    className={`rounded-2xl p-8 min-h-[220px] flex items-center justify-center text-center cursor-pointer shadow-lg ${
                      flipped ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                    }`}
                  >
                    <p className="text-xl leading-relaxed">{flipped ? card.answer : card.question}</p>
                  </motion.div>
                </AnimatePresence>

                {!flipped ? (
                  <button
                    onClick={() => setFlipped(true)}
                    className="w-full mt-5 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                  >
                    Mostrar resposta <span className="opacity-70 text-xs">(espaço)</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-4 gap-2 mt-5">
                    {GRADES.map((g) => (
                      <button
                        key={g.key}
                        disabled={saving}
                        onClick={() => answer(g.quality)}
                        className={`py-3 rounded-xl text-white font-semibold disabled:opacity-60 ${g.className}`}
                      >
                        {g.label}
                        <span className="block text-xs font-normal opacity-80">
                          {formatInterval(nextReview(card, g.quality).interval)} · {g.key}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {phase === 'summary' && summary && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
                <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                <p className="text-xl font-bold text-gray-800 dark:text-white">Sessão concluída!</p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  Você lembrou {summary.remembered} de {summary.total} cartões de primeira ({summary.percent}%).
                </p>
                {summary.xp > 0 && <p className="text-purple-600 font-semibold mt-1">+{summary.xp} XP</p>}
                <div className="flex gap-3 justify-center mt-6">
                  <button onClick={load} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">
                    Ver se há mais cartões
                  </button>
                  <Link to="/" className="px-5 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300">
                    Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Review;
