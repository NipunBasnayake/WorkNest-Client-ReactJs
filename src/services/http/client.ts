import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, SessionType } from "@/types";
import { asRecord, firstDefined, getString } from "@/services/http/parsers";
import { attachApiErrorInfo, isNetworkFailure } from "@/services/http/errorMapper";
import { unwrapApiData } from "@/services/http/response";
import { useNetworkStore } from "@/store/networkStore";
import { ENV } from "@/config/env";
import { tokenStorage } from "@/services/auth/tokenStorage";
import { getAuthRuntimeAdapter } from "@/services/auth/authRuntimeBridge";

const BASE_URL = ENV.apiBaseUrl;
const LOGIN_ROUTE = "/login";

export { tokenStorage };

export const publicClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15_000,
});

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15_000,
});

let isRefreshing = false;
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

type RefreshResponse = { accessToken: string; refreshToken?: string };
type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean };
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

export function extractTenantSlugFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  const parts = path.split("/").filter(Boolean);
  if (parts.length > 0) {
    const candidate = parts[0];
    const nonTenantRoots = [
      "login", "register", "register-company", "forgot-password", 
      "reset-password", "force-password-change",
      "unauthorized", "platform", "app"
    ];
    if (!nonTenantRoots.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function buildTenantApiUrl(path: string): string {
  const tenantSlug = extractTenantSlugFromPath() || tokenStorage.getTenantKey();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (tenantSlug) {
    return `/api/${tenantSlug}${cleanPath}`;
  }
  return `/api/tenant${cleanPath}`;
}



function redirectTo(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== path) {
    window.location.replace(path);
  }
}

export function isAnonymousRecruitmentPath(pathname: string): boolean {
  return /^\/[^/]+\/careers(?:\/.*)?\/?$/.test(pathname)
    || /^\/[^/]+\/applications\/[^/]+\/success\/?$/.test(pathname);
}

async function resolveTenantKeyForRefresh(): Promise<string | null> {
  return getAuthRuntimeAdapter()?.getTenantKey()
    ?? tokenStorage.getTenantKey()
    ?? extractTenantSlugFromPath();
}

async function applyTokenRefresh(accessToken: string, tenantKey: string | null) {
  const authRuntime = getAuthRuntimeAdapter();
  if (authRuntime) {
    authRuntime.applyTokenRefresh(accessToken, tenantKey);
    return;
  }

  const sessionType: SessionType = tokenStorage.getSession() ?? (tenantKey ? "tenant" : "platform");
  tokenStorage.setTokens(accessToken);
  tokenStorage.setContext(tenantKey, sessionType);
}

async function hardLogout(redirectPath = LOGIN_ROUTE) {
  const keepAnonymousPageOpen = typeof window !== "undefined"
    && redirectPath === LOGIN_ROUTE
    && isAnonymousRecruitmentPath(window.location.pathname);
  const authRuntime = getAuthRuntimeAdapter();
  if (authRuntime) {
    if (keepAnonymousPageOpen) {
      tokenStorage.clear();
      return;
    }
    authRuntime.hardLogout(redirectPath);
    return;
  }

  tokenStorage.clear();
  if (!keepAnonymousPageOpen) redirectTo(redirectPath);
}

function readResponseMessage(payload: unknown): string | null {
  const value = asRecord(payload);
  return firstDefined(
    getString(value.message),
    getString(asRecord(value.error).message),
    getString(asRecord(value.data).message)
  ) ?? null;
}

function applyMappedError(error: unknown): unknown {
  const info = attachApiErrorInfo(error);
  const store = useNetworkStore.getState();

  if (isNetworkFailure(info.kind)) {
    store.reportApiIssue(info);
  }

  if (!axios.isAxiosError(error)) return error;

  const hasBackendMessage = readResponseMessage(error.response?.data);
  const shouldUseFriendlyMessage =
    !error.response ||
    error.response.status >= 500 ||
    !hasBackendMessage;

  if (shouldUseFriendlyMessage) {
    error.message = info.userMessage;

    if (error.response?.data && typeof error.response.data === "object") {
      (error.response.data as Record<string, unknown>).message = info.userMessage;
    }
  }

  return error;
}

function onRequestSucceeded() {
  useNetworkStore.getState().markApiHealthy();
}

function preserveBrowserMultipartBoundary(config: InternalAxiosRequestConfig) {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    // Axios/browser must generate this header so it includes the matching boundary.
    config.headers.delete("Content-Type");
  }
}

publicClient.interceptors.response.use(
  (response) => {
    onRequestSucceeded();
    return response;
  },
  (error: AxiosError) => Promise.reject(applyMappedError(error))
);

publicClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  preserveBrowserMultipartBoundary(config);

  // Public recruitment endpoints are deliberately URL-tenant-scoped and anonymous.
  // Keep these requests independent of any browser session so opening a shared link
  // never depends on cookies, stored tokens, device headers, or a CORS preflight for
  // non-essential custom headers.
  if (config.url?.startsWith("/api/public/")) {
    config.withCredentials = false;
    delete config.headers.Authorization;
    delete config.headers["X-CSRF-Token"];
    delete config.headers["X-CSRF-TOKEN"];
    delete config.headers["X-Device-Id"];
    delete config.headers["X-Device-Name"];
    delete config.headers["X-Tenant-Slug"];
    delete config.headers["X-Tenant-ID"];
    if (!config.data) config.headers.delete("Content-Type");
    return config;
  }

  const csrfToken = tokenStorage.getCsrf();
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }

  const deviceId = tokenStorage.getDeviceId();
  config.headers["X-Device-Id"] = deviceId;
  if (typeof navigator !== "undefined") {
    config.headers["X-Device-Name"] = navigator.userAgent;
  }

  const tenantSlug = extractTenantSlugFromPath() || tokenStorage.getTenantKey();
  if (tenantSlug) {
    config.headers["X-Tenant-Slug"] = tenantSlug;
    config.headers["X-Tenant-ID"] = tenantSlug;
  }

  return config;
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  preserveBrowserMultipartBoundary(config);

  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = tokenStorage.getCsrf();
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }

  const deviceId = tokenStorage.getDeviceId();
  config.headers["X-Device-Id"] = deviceId;
  if (typeof navigator !== "undefined") {
    config.headers["X-Device-Name"] = navigator.userAgent;
  }

  const tenantSlug = extractTenantSlugFromPath() || tokenStorage.getTenantKey();
  if (tenantSlug) {
    config.headers["X-Tenant-Slug"] = tenantSlug;
    config.headers["X-Tenant-ID"] = tenantSlug;
  } else {
    delete config.headers["X-Tenant-Slug"];
    delete config.headers["X-Tenant-ID"];
  }

  if (config.url && config.url.includes("/api/tenant/") && tenantSlug) {
    config.url = config.url.replace("/api/tenant/", `/api/${tenantSlug}/`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    onRequestSucceeded();
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(applyMappedError(error));
    if (error.response?.status !== 401) return Promise.reject(applyMappedError(error));

    if (originalRequest.url?.includes("/api/auth/refresh")) {
      flushRefreshSubscribers(error, null);
      isRefreshing = false;
      await hardLogout(LOGIN_ROUTE);
      return Promise.reject(applyMappedError(error));
    }

    if (originalRequest._retry) {
      return Promise.reject(applyMappedError(error));
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

    const tenantKey = await resolveTenantKeyForRefresh();
    try {
      // Include stored refresh token if available for backend validation
      const storedRefreshToken = tokenStorage.getRefresh();
      const refreshPayload: Record<string, string> = {};
      if (tenantKey) refreshPayload.tenantKey = tenantKey;
      if (storedRefreshToken) refreshPayload.refreshToken = storedRefreshToken;

      const { data } = await publicClient.post<ApiResponse<RefreshResponse> | RefreshResponse>("/api/auth/refresh", refreshPayload);

      const parsed = unwrapApiData<RefreshResponse>(data);
      if (!parsed.accessToken) {
        throw new Error("Refresh response did not include accessToken.");
      }

      if (parsed.refreshToken) {
        tokenStorage.setTokens(parsed.accessToken, parsed.refreshToken);
      } else {
        tokenStorage.setTokens(parsed.accessToken);
      }
      if ((parsed as Record<string, unknown>).csrfToken) {
        tokenStorage.setCsrf(getString((parsed as Record<string, unknown>).csrfToken) ?? null);
      }
      await applyTokenRefresh(parsed.accessToken, tenantKey);
      flushRefreshSubscribers(null, parsed.accessToken);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${parsed.accessToken}`,
      };

      return apiClient(originalRequest);
    } catch (refreshError) {
      flushRefreshSubscribers(refreshError, null);
      await hardLogout(LOGIN_ROUTE);
      return Promise.reject(applyMappedError(refreshError));
    } finally {
      isRefreshing = false;
    }
  }
);
