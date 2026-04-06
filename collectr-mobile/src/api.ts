import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const hostUri = Constants.expoConfig?.hostUri || '';
const isRunningOnLocalhost =
  typeof window !== 'undefined' && window.location?.origin?.includes('localhost') ||
  hostUri.includes('localhost') ||
  hostUri.includes('127.0.0.1');

const API_BASE_URL = isRunningOnLocalhost
  ? 'http://localhost:8000'
  : 'https://pokemon-vault1.onrender.com';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;

export async function login(email: string, password: string) {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);

  const res = await api.post('/users/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const token = res.data?.access_token;
  if (token) {
    await AsyncStorage.setItem('token', token);
  }
  return res.data;
}

export async function register(email: string, password: string) {
  const res = await api.post('/users/register', { email, password });
  return res.data;
}

export async function logout() {
  await AsyncStorage.removeItem('token');
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}
