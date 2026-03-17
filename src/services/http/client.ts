import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, SessionType } from "@/types";
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
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

type RefreshResponse = { accessToken: string; refreshToken?: string };
type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean };
type AuthStoreState = {
  tenantKey: string | null;
  applyTokenRefresh: (accessToken: string, refreshToken: string, tenantKey: string | null) => void;
  hardLogout: (redirectTo?: string) => void;
};

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (err: unknown) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function flushRefreshSubscribers(error: unknown, token: string | null) {
  refreshSubscribers.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
      return;
    }
    reject(error ?? new Error("Token refresh failed."));
  });
  refreshSubscribers = [];
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

function redirectTo(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== path) {
    window.location.replace(path);
  }
}

async function getAuthStoreState(): Promise<AuthStoreState | null> {
  try {
    const { useAuthStore } = await import("@/store/authStore");
    return useAuthStore.getState() as AuthStoreState;
  } catch {
    return null;
  }
}

async function resolveTenantKeyForRefresh(): Promise<string | null> {
  const authStore = await getAuthStoreState();
  return authStore?.tenantKey ?? tokenStorage.getTenantKey();
}

async function applyTokenRefresh(accessToken: string, refreshToken: string, tenantKey: string | null) {
  const authStore = await getAuthStoreState();
  if (authStore) {
    authStore.applyTokenRefresh(accessToken, refreshToken, tenantKey);
    return;
  }

  const sessionType: SessionType = tokenStorage.getSession() ?? (tenantKey ? "tenant" : "platform");
  tokenStorage.setTokens(accessToken, refreshToken);
  tokenStorage.setContext(tenantKey, sessionType);
}

async function hardLogout(redirectPath = SESSION_EXPIRED_ROUTE) {
  const authStore = await getAuthStoreState();
  if (authStore) {
    authStore.hardLogout(redirectPath);
    return;
  }

  tokenStorage.clear();
  redirectTo(redirectPath);
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
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(error);
    if (error.response?.status !== 401) return Promise.reject(error);

    if (originalRequest.url?.includes("/api/auth/refresh")) {
      flushRefreshSubscribers(error, null);
      isRefreshing = false;
      await hardLogout(SESSION_EXPIRED_ROUTE);
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (token: string) => {
            originalRequest._retry = true;
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };
            resolve(apiClient(originalRequest));
          },
          reject
        );
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefresh();
    const tenantKey = await resolveTenantKeyForRefresh();
    if (!refreshToken) {
      flushRefreshSubscribers(error, null);
      isRefreshing = false;
      await hardLogout(SESSION_EXPIRED_ROUTE);
      return Promise.reject(error);
    }

    try {
      const { data } = await publicClient.post<ApiResponse<RefreshResponse> | RefreshResponse>(
        "/api/auth/refresh",
        {
          refreshToken,
          tenantKey,
        }
      );

      const parsed = unwrapApiData<RefreshResponse>(data);
      if (!parsed.accessToken) {
        throw new Error("Refresh response did not include accessToken.");
      }

      const nextRefresh = parsed.refreshToken ?? refreshToken;
      await applyTokenRefresh(parsed.accessToken, nextRefresh, tenantKey);
      flushRefreshSubscribers(null, parsed.accessToken);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${parsed.accessToken}`,
      };

      return apiClient(originalRequest);
    } catch (refreshError) {
      flushRefreshSubscribers(refreshError, null);
      await hardLogout(SESSION_EXPIRED_ROUTE);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
