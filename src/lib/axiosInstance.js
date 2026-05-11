import axios from 'axios';
import { showSessionExpiredModal } from './sessionModal';

const api = axios.create({
  baseURL: 'https://server-dukungin-production.up.railway.app',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!token) {
    showSessionExpiredModal();
    return Promise.reject(new Error('No token'));
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      showSessionExpiredModal();
    }
    return Promise.reject(error);
  }
);

export default api;