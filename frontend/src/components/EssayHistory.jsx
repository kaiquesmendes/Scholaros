// frontend/src/components/EssayHistory.jsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FaHistory, FaTrash, FaFolderOpen } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { listEssays, deleteEssay } from '../services/studyService';

const MODE_LABEL = { enem: 'ENEM', faculdade: 'Faculdade', tcc: 'TCC' };
const SCALE_MAX = { enem: 1000, faculdade: 100, tcc: 100 };

const formatDate = (ms) => new Date(ms).toLocaleDateString('pt-BR');
const formatGrade = (e) => (e.mode === 'enem' ? `${e.grade}/1000` : `${e.grade}%`);

// Histórico das redações analisadas, com gráfico de evolução.
// `version` muda quando uma nova análise é salva, para recarregar a lista.
const EssayHistory = ({ uid, version, onOpen }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const result = await listEssays(uid);
      if (active) {
        setItems(result.success ? result.items : []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [uid, version]);

  const visible = filter === 'all' ? items : items.filter((e) => e.mode === filter);

  // Eixo em % da nota máxima para comparar ENEM (0-1000) com os demais (0-100).
  const chartData = [...visible].reverse().map((e) => ({
    label: formatDate(e.createdAt),
    percent: Math.round((e.grade / SCALE_MAX[e.mode]) * 100),
    grade: formatGrade(e),
  }));

  const handleDelete = async (entry) => {
    if (!window.confirm('Excluir esta redação do histórico?')) return;
    const result = await deleteEssay(uid, entry.id);
    if (result.success) {
      setItems((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success('Redação excluída');
    } else {
      toast.error('Não foi possível excluir');
    }
  };

  return (
    <section className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaHistory className="text-purple-600" /> Histórico de redações
        </h3>
        <div className="flex gap-2">
          {['all', 'enem', 'faculdade', 'tcc'].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === key ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {key === 'all' ? 'Todas' : MODE_LABEL[key]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando histórico...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhuma redação analisada ainda. Cada análise é salva aqui para você acompanhar sua evolução.
        </p>
      ) : (
        <>
          {chartData.length >= 2 && (
            <div className="h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(value, name, item) => [item.payload.grade, 'Nota']} />
                  <Line type="monotone" dataKey="percent" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {visible.map((entry) => (
              <li key={entry.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {entry.content.slice(0, 70).replace(/\s+/g, ' ')}…
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(entry.createdAt)} · {MODE_LABEL[entry.mode]} · {entry.wordCount} palavras
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-purple-600 font-bold">{formatGrade(entry)}</span>
                  <button onClick={() => onOpen(entry)} title="Abrir no editor" className="text-gray-500 hover:text-purple-600">
                    <FaFolderOpen />
                  </button>
                  <button onClick={() => handleDelete(entry)} title="Excluir" className="text-gray-400 hover:text-red-600">
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default EssayHistory;
