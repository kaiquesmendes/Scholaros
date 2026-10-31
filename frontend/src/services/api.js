import axios from 'axios';
import { auth } from '../config/firebase';

// Em produção defina VITE_API_URL no ambiente de build (Vercel). O fallback aponta
// para o backend publicado; em desenvolvimento use frontend/.env (ver .env.example).
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://scholaros-5ncu.onrender.com';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o ID token do Firebase Auth em toda requisição.
// As rotas de IA no backend exigem um usuário autenticado.
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mensagem amigável a partir de um erro do axios (usa o `error` devolvido pelo backend).
export const getApiErrorMessage = (error, fallback = 'Algo deu errado. Tente novamente.') =>
  error?.response?.data?.error || fallback;

export const essayAPI = {
  analyze: (payload) => api.post('/essay/analyze', payload),
  formatABNT: (payload) => api.post('/essay/format-abnt', payload),
};

export const tutorAPI = {
  // messages: [{ role: 'user' | 'assistant', content }]; context: texto do material (opcional)
  chat: (messages, context) => api.post('/chat', { messages, ...(context ? { context } : {}) }),
};

export const pdfAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/pdf/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Documentos longos são processados em várias etapas no servidor.
      timeout: 180000,
    });
  },
};

export default api;
