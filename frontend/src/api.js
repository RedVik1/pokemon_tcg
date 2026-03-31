import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
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
