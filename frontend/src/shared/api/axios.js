import axios from 'axios';

const api = axios.create({
  // ✅ If on Render, use the site root. If local, use localhost.
  baseURL: window.location.origin.includes("localhost")
    ? "http://localhost:8000"
    : window.location.origin
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-clear expired tokens on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;

// Optional helper: login (stores token on success)
export async function login(email, password) {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);

  const res = await api.post('/users/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const token = res.data?.access_token;
  if (token) localStorage.setItem('token', token);
  return res.data;
}

export async function register(email, password) {
  const res = await api.post('/users/register', { email, password });
  return res.data;
}
