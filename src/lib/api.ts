import axios from 'axios';

/**
 * API client configuration
 * Configures axios instance with base URL, authentication, and error handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Automatically adds JWT token to request headers if available
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Handles 401 unauthorized errors by redirecting to login
 * Avoids redirect loop if already on login page
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Redirect to login on 401, unless already on login page
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // Avoid redirect loop - let error show on login page
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * FormData API helper
 * Provides methods for file upload requests (e.g., avatar uploads)
 * Properly handles multipart/form-data content type
 */
export const apiFormData = {
  async patch<T>(endpoint: string, formData: FormData): Promise<{ data: T }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - axios automatically sets it with boundary for FormData
    
    const response = await axios.patch<T>(`${API_URL}${endpoint}`, formData, {
      headers,
    });
    
    return { data: response.data };
  },

  async post<T>(endpoint: string, formData: FormData): Promise<{ data: T }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post<T>(`${API_URL}${endpoint}`, formData, {
      headers,
    });
    
    return { data: response.data };
  }
};

export default api;