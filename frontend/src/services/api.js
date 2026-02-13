import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Pages API
export const pagesApi = {
  list: (category) => api.get('/pages', { params: category ? { category } : {} }),
  get: (slug) => api.get(`/pages/${slug}`),
  create: (data) => api.post('/pages', data),
  update: (slug, data) => api.put(`/pages/${slug}`, data),
};

// Bloomberg API
export const bloombergApi = {
  list: (params) => api.get('/bloomberg', { params }),
  get: (id) => api.get(`/bloomberg/${id}`),
  create: (data) => api.post('/bloomberg', data),
  update: (id, data) => api.put(`/bloomberg/${id}`, data),
  delete: (id) => api.delete(`/bloomberg/${id}`),
};

// Books API
export const booksApi = {
  list: (params) => api.get('/books', { params }),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

// Users API
export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// News API
export const newsApi = {
  list: () => api.get('/news'),
  refresh: () => api.post('/news/refresh'),
};

// Chat API
export const chatApi = {
  send: (data) => api.post('/chat', data),
  history: (sessionId) => api.get(`/chat/${sessionId}`),
  corpora: () => api.get('/chat/corpora/list'),
};

// Ingest API
export const ingestApi = {
  upload: (formData) => api.post('/ingest', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  status: (corpus) => api.get(`/ingest/${corpus}/status`),
  clear: (corpus) => api.delete(`/ingest/${corpus}`),
};

export default api;
