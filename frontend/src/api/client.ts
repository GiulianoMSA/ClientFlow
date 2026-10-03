import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../services/auth-storage';

import { refreshToken } from '../services/auth.service';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is not configured.');
}

export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const storedRefreshToken = getRefreshToken();

    if (!storedRefreshToken) {
      clearTokens();

      window.dispatchEvent(
        new Event('auth:session-expired'),
      );

      return Promise.reject(error);
    }

    try {
      const tokens = await refreshToken(
        storedRefreshToken,
      );

      saveTokens(
        tokens.accessToken,
        tokens.refreshToken,
      );

      originalRequest.headers.Authorization =
        `Bearer ${tokens.accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();

      window.dispatchEvent(
        new Event('auth:session-expired'),
      );

      return Promise.reject(refreshError);
    }
  },
);