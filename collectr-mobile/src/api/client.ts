import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { storage } from '../lib/storage';

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(async (requestConfig) => {
      const storedToken = this.token || await storage.getToken();
      if (storedToken) {
        requestConfig.headers.Authorization = `Bearer ${storedToken}`;
      }
      return requestConfig;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await storage.removeToken();
          this.token = null;
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private normalizeError(error: AxiosError) {
    const message = axios.isAxiosError(error)
      ? (error.response?.data as { detail?: string })?.detail || error.message
      : 'An unexpected error occurred';

    return {
      message,
      status: error.response?.status,
      original: error,
    };
  }

  get instance() {
    return this.instance;
  }

  async get<T>(url: string, requestConfig?: Record<string, unknown>) {
    const response = await this.instance.get<T>(url, requestConfig);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, requestConfig?: Record<string, unknown>) {
    const response = await this.instance.post<T>(url, data, requestConfig);
    return response.data;
  }

  async delete<T>(url: string, requestConfig?: Record<string, unknown>) {
    const response = await this.instance.delete<T>(url, requestConfig);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient.instance;
