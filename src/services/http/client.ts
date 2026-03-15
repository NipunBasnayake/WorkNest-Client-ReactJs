import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types";
import { unwrapApiData } from "@/services/http/response";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const SESSION_EXPIRED_ROUTE = "/session-expired";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "wn_access_token",
  REFRESH_TOKEN: "wn_refresh_token",
  TENANT_KEY: "wn_tenant_key",
  SESSION_TYPE: "wn_session_type",
} as const;

export const tokenStorage = {
  getAccess: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefresh: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  getTenantKey: () => localStorage.getItem(STORAGE_KEYS.TENANT_KEY),
  getSession: () => localStorage.getItem(STORAGE_KEYS.SESSION_TYPE) as "platform" | "tenant" | null,

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },

  setContext: (tenantKey: string | null, sessionType: "platform" | "tenant") => {
    if (tenantKey) {
      localStorage.setItem(STORAGE_KEYS.TENANT_KEY, tenantKey);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TENANT_KEY);
    }
    localStorage.setItem(STORAGE_KEYS.SESSION_TYPE, sessionType);
  },

  clear: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

export const publicClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

type RefreshResponse = { accessToken: string; refreshToken?: string };

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

function isTenantApiRequest(url?: string): boolean {
  if (!url) return false;

  let path = url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    path = new URL(url).pathname;
  } else if (!url.startsWith("/")) {
    path = `/${url}`;
  }

  return path.startsWith("/api/tenant/");
}

function redirectToSessionExpired() {
  tokenStorage.clear();
  if (window.location.pathname !== SESSION_EXPIRED_ROUTE) {
    window.location.replace(SESSION_EXPIRED_ROUTE);
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantKey = tokenStorage.getTenantKey();
  if (isTenantApiRequest(config.url) && tenantKey) {
    config.headers["X-Tenant-ID"] = tenantKey;
  } else {
    delete config.headers["X-Tenant-ID"];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/api/auth/refresh")) {
        redirectToSessionExpired();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${token}`,
              };
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        redirectToSessionExpired();
        return Promise.reject(error);
      }

      try {
        const { data } = await publicClient.post<ApiResponse<RefreshResponse> | RefreshResponse>(
          "/api/auth/refresh",
          { refreshToken }
        );

        const parsed = unwrapApiData<RefreshResponse>(data);
        if (!parsed.accessToken) {
          throw new Error("Refresh response did not include accessToken.");
        }

        const nextRefresh = parsed.refreshToken ?? refreshToken;
        tokenStorage.setTokens(parsed.accessToken, nextRefresh);
        processQueue(null, parsed.accessToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${parsed.accessToken}`,
        };

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        redirectToSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
