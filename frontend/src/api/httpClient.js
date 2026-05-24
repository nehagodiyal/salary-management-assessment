import axios from 'axios';
import env from '@/config/env';
import tokenStore from './tokenStore';

const AUTH_FREE_PATHS = ['/auth/login', '/auth/refresh'];

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const isAuthFree = AUTH_FREE_PATHS.some((p) => (config.url || '').includes(p));
  if (!isAuthFree) {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise = null;
let onUnauthorized = null;

export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const refreshAccessToken = async () => {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await axios.post(
    `${env.apiBaseUrl}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  tokenStore.setTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  return data.access_token;
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    const isAuthFree = AUTH_FREE_PATHS.some((p) => url.includes(p));

    if (status === 401 && !isAuthFree && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStore.clear();
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default httpClient;
