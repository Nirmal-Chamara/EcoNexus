import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { tokenStorage } from './tokenStorage';
import { RefreshTokenResponse } from '../types/user';

// ─────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: env.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─────────────────────────────────────────────
// Single-flight refresh lock
// Prevents multiple concurrent 401 responses from
// each triggering an independent refresh request.
// ─────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function resolveQueue(newAccessToken: string): void {
  refreshQueue.forEach(({ resolve }) => resolve(newAccessToken));
  refreshQueue = [];
}

function rejectQueue(error: unknown): void {
  refreshQueue.forEach(({ reject }) => reject(error));
  refreshQueue = [];
}

// ─────────────────────────────────────────────
// Global force-logout emitter
// AuthContext subscribes to this to trigger sign-out
// from anywhere in the app (including interceptors).
// ─────────────────────────────────────────────
type ForceLogoutHandler = () => void;
let _forceLogoutHandler: ForceLogoutHandler | null = null;

export function registerForceLogoutHandler(handler: ForceLogoutHandler): void {
  _forceLogoutHandler = handler;
}

export function triggerForceLogout(): void {
  if (_forceLogoutHandler) {
    _forceLogoutHandler();
  }
}

// ─────────────────────────────────────────────
// Request Interceptor — attach Bearer token
// ─────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Response Interceptor — transparent token refresh on 401
// ─────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 Unauthorized errors that haven't been retried already
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh attempt for auth endpoints themselves
    const url = originalRequest.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        })
        .catch(() => Promise.reject(error));
    }

    // Start a new refresh cycle
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = await tokenStorage.getRefreshToken();

      if (!storedRefreshToken) {
        throw new Error('No refresh token stored');
      }

      const response = await axios.post<RefreshTokenResponse>(
        `${env.API_URL}/auth/refresh`,
        { refreshToken: storedRefreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      // Persist rotated tokens
      await tokenStorage.saveTokens(newAccessToken, newRefreshToken);

      // Unblock all queued requests
      resolveQueue(newAccessToken);

      // Retry the original request with fresh token
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      rejectQueue(refreshError);
      await tokenStorage.clearTokens();
      // Signal AuthContext to force sign-out across the entire app
      triggerForceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);