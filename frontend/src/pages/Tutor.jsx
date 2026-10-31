// frontend/src/pages/Tutor.jsx
// Tutor de estudos: chat com a IA, opcionalmente baseado em um dos materiais salvos.
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaRobot, FaPaperPlane, FaTrash, FaUser, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { tutorAPI, getApiErrorMessage } from '../services/api';
import { listMaterials } from '../services/studyService';

const MAX_STORED = 40;
const SUGGESTIONS = [
  'Explique o assunto de forma simples, como se eu fosse iniciante.',
  'Me faça 3 perguntas para testar meu entendimento.',
  'Crie uma analogia para os conceitos principais.',
];

// Monta o contexto enviado ao tutor a partir do material salvo (o servidor limita o tamanho).
const buildContext = (material) => {
  if (!material) return '';
  const cards = (material.flashcards || []).map((c) => `- ${c.question} ${c.answer}`).join('\n');
  return `Documento: ${material.fileName}\n\nResumo:\n${material.summary || ''}\n\nConceitos-chave:\n${cards}`;
};

const storageKey = (uid, materialId) => `scholaros_tutor_${uid}_${materialId || 'geral'}`;

const readStored = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStored = (key, messages) => {
  try {
    localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {
    /* armazenamento indisponível: a conversa só vive nesta sessão */
  }
};

const Tutor = ({ user }) => {
  const [params, setParams] = useSearchParams();
  const materialId = params.get('material') || '';

  const [materials, setMaterials] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const material = materials.find((m) => m.id === materialId) || null;

  useEffect(() => {
    (async () => {
      const result = await listMaterials(user.uid);
      if (result.success) setMaterials(result.items);
    })();
  }, [user.uid]);

  // Cada material (e a conversa "geral") tem seu próprio histórico.
  useEffect(() => {
    setMessages(readStored(storageKey(user.uid, materialId)));
  }, [user.uid, materialId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || loading) return;

    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const response = await tutorAPI.chat(next, buildContext(material));
      const updated = [...next, { role: 'assistant', content: response.data.response }];
      setMessages(updated);
      writeStored(storageKey(user.uid, materialId), updated);
    } catch (error) {
      // A pergunta fica na conversa; o aluno pode reenviar.
      writeStored(storageKey(user.uid, materialId), next);
      toast.error(getApiErrorMessage(error, 'O tutor não respondeu. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    if (messages.length > 0 && !window.confirm('Apagar esta conversa?')) return;
    setMessages([]);
    writeStored(storageKey(user.uid, materialId), []);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const changeMaterial = (id) => {
    if (id) setParams({ material: id });
    else setParams({});
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <FaRobot className="text-purple-600" /> Tutor de estudos
              </h1>
              <div className="flex items-center gap-2">
                <select
                  value={materialId}
                  onChange={(e) => changeMaterial(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white max-w-[220px]"
                  aria-label="Material de estudo"
                >
                  <option value="">Conversa geral</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.fileName}</option>
                  ))}
                </select>
                <button onClick={clear} title="Apagar conversa" className="p-2 text-gray-400 hover:text-red-600">
                  <FaTrash />
                </button>
              </div>
            </div>

            {material && (
              <p className="text-xs text-purple-600 mb-2">
                📎 O tutor está usando o material “{material.fileName}” como base.
              </p>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <FaRobot className="text-5xl text-purple-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    {material ? 'Pergunte qualquer coisa sobre este material.' : 'Pergunte sobre qualquer matéria ou escolha um material acima.'}
                  </p>
                  <div className="flex flex-col gap-2 mt-5 max-w-md mx-auto">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-sm text-left px-4 py-2 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${m.role === 'user' ? 'bg-pink-500' : 'bg-purple-600'}`}>
                    {m.role === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 items-center text-gray-500 text-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                    <FaRobot size={14} />
                  </div>
                  <FaSpinner className="animate-spin" /> Pensando...
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="flex gap-2 mt-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                maxLength={4000}
                placeholder="Digite sua dúvida... (Enter envia, Shift+Enter quebra a linha)"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="px-5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
                aria-label="Enviar"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Tutor;
