import axios from 'axios';
import { auth } from '../config/firebase';

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

export const essayAPI = {
  analyze: (content, mode) => api.post('/essay/analyze', { content, mode }),
};

export const pdfAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/pdf/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const userAPI = {
  getProgress: () => api.get('/user/progress'),
  updateStats: (data) => api.put('/user/stats', data),
};

export default api;