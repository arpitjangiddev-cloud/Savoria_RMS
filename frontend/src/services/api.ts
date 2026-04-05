import axios from 'axios';

const PROD_API = 'https://savoria-rms.onrender.com/api';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || PROD_API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
