// frontend/src/components/PDFResult.jsx
// Material de estudo gerado a partir de um PDF: resumo, flashcards, quiz e mapa mental.
// Usado tanto logo após processar quanto ao reabrir um material salvo.
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaLightbulb, FaCheckCircle, FaBrain, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

const faceStyle = { gridArea: '1 / 1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };

// Cartão que vira ao clicar: pergunta na frente, resposta no verso.
const Flashcard = ({ card }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-label={flipped ? 'Mostrar a pergunta' : 'Mostrar a resposta'}
      className="text-left w-full"
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ transformStyle: 'preserve-3d', display: 'grid' }}
      >
        <div style={faceStyle} className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 min-h-[130px] flex flex-col justify-between">
          <p className="font-medium text-gray-800 dark:text-white">{card.question}</p>
          <span className="text-xs text-purple-500 mt-3">Clique para ver a resposta</span>
        </div>
        <div
          style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
          className="bg-purple-600 text-white rounded-lg p-4 min-h-[130px] flex flex-col justify-between"
        >
          <p className="text-sm leading-relaxed">{card.answer}</p>
          <span className="text-xs text-white/70 mt-3">Clique para voltar</span>
        </div>
      </motion.div>
    </button>
  );
};

// Quiz com correção imediata, explicação e placar final.
const Quiz = ({ questions }) => {
  const [answers, setAnswers] = useState({}); // índice da questão -> alternativa escolhida
  const answered = Object.keys(answers).length;
  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;

  const optionClass = (q, qi, oi) => {
    const chosen = answers[qi];
    if (chosen === undefined) return 'border-gray-200 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20';
    if (oi === q.correctIndex) return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300';
    if (oi === chosen) return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300';
    return 'border-gray-200 dark:border-gray-700 opacity-60';
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <div key={qi} className="border-b border-gray-100 dark:border-gray-700 pb-5 last:border-0">
          <p className="font-semibold text-gray-800 dark:text-white mb-3">{qi + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options?.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                disabled={answers[qi] !== undefined}
                onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg border-2 transition-all ${optionClass(q, qi, oi)}`}
              >
                <strong>{String.fromCharCode(65 + oi)}.</strong> {opt}
              </button>
            ))}
          </div>
          {answers[qi] !== undefined && (
            <p className="text-sm mt-3 text-gray-600 dark:text-gray-300">
              {answers[qi] === q.correctIndex ? '✅ Correto! ' : `❌ A resposta certa é a letra ${String.fromCharCode(65 + q.correctIndex)}. `}
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      {answered === questions.length && (
        <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="font-semibold text-purple-700 dark:text-purple-300">
            Você acertou {score} de {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </p>
          <button
            type="button"
            onClick={() => setAnswers({})}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-purple-700"
          >
            <FaRedo /> Refazer
          </button>
        </div>
      )}
    </div>
  );
};

const BRANCH_COLORS = ['#7c3aed', '#db2777', '#0891b2', '#d97706', '#059669', '#2563eb', '#dc2626', '#4f46e5'];

const MindMap = ({ map }) => {
  if (!map) return null;
  if (typeof map === 'string') {
    return (
      <div className="space-y-1">
        {map.split('\n').filter((l) => l.trim()).map((line, i) => <p key={i} className="text-sm text-white/90">{line}</p>)}
      </div>
    );
  }
  return (
    <div>
      <p className="text-center text-lg font-bold mb-4">{map.title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {map.branches.map((branch, i) => (
          <div
            key={i}
            className="bg-white/95 dark:bg-gray-900/80 text-gray-800 dark:text-gray-100 rounded-lg p-3 border-t-4"
            style={{ borderColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }}
          >
            <p className="font-semibold" style={{ color: BRANCH_COLORS[i % BRANCH_COLORS.length] }}>{branch.topic}</p>
            <ul className="mt-1 space-y-0.5 text-sm list-disc pl-4">
              {branch.points.map((p, pi) => <li key={pi}>{p}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const Section = ({ icon, title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const PDFResult = ({ data }) => {
  const coverage = data.coveragePercent ?? data.metadata?.coveragePercent ?? 100;
  const warnings = data.warnings || [];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      {coverage < 100 && (
        <div className="flex gap-2 items-start bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm">
          <FaExclamationTriangle className="mt-0.5 shrink-0" />
          <span>Documento muito longo: o material foi gerado a partir dos primeiros {coverage}% do texto.</span>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm">
          {warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
        </div>
      )}

      {data.summary && (
        <Section icon={<FaBook className="text-purple-500 text-xl" />} title="Resumo inteligente">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{data.summary}</p>
        </Section>
      )}

      {data.flashcards?.length > 0 && (
        <Section icon={<FaLightbulb className="text-yellow-500 text-xl" />} title={`Flashcards (${data.flashcards.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.flashcards.map((card, i) => <Flashcard key={i} card={card} />)}
          </div>
        </Section>
      )}

      {data.questions?.length > 0 && (
        <Section icon={<FaCheckCircle className="text-green-500 text-xl" />} title="Questões de fixação">
          <Quiz questions={data.questions} />
        </Section>
      )}

      {data.mindMap && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <FaBrain className="text-white text-xl" />
            <h3 className="text-xl font-semibold">Mapa mental</h3>
          </div>
          <MindMap map={data.mindMap} />
        </div>
      )}
    </motion.div>
  );
};

export default PDFResult;
