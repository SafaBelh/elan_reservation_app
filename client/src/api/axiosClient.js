// ==============================================================================
// src/api/axiosClient.js
// Instance Axios unique + intercepteur JWT (Seance 6).
// ==============================================================================

import axios from 'axios';

// 1. Instance Axios pointant vers le serveur Express (ou l'URL Cloud en production)
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// 2. Intercepteur JWT : attache automatiquement "Bearer <token>" a chaque requete
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
