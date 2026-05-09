import axios from 'axios';
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://scholaros-5ncu.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
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