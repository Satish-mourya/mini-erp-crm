import axios from 'axios';

// Create an Axios instance pointing to the backend API
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Dispatch custom event to trigger logout in App.jsx
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');

// Users Service
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Customers Service
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Products Service
export const getProducts = (params) => api.get('/products', { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Stock Service
export const addStock = (data) => api.post('/stock/add', data);
export const removeStock = (data) => api.post('/stock/remove', data);
export const getStockLogs = (params) => api.get('/stock/logs', { params });

// Challans Service
export const getChallans = (params) => api.get('/challans', { params });
export const getChallanById = (id) => api.get(`/challans/${id}`);
export const createChallan = (data) => api.post('/challans', data);
export const updateChallanStatus = (id, status) => api.put(`/challans/${id}/status`, { status });

// Dashboard Service
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;
