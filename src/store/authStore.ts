import { create } from "zustand";
import { tokenStorage } from "@/services/http/client";
import { loginApi, getMeApi, logoutApi } from "@/services/api/authApi";
import type { AuthUser, LoginPayload, SessionType } from "@/types";

interface AuthState {
  /* State */
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionType: SessionType | null;
  tenantKey: string | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;

  /* Actions */
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
}

function deriveSessionType(user: AuthUser): SessionType {
  if (user.tenantKey) return "tenant";
  const platformRoles = ["PLATFORM_ADMIN", "PLATFORM_USER"];
  return platformRoles.includes(user.role) ? "platform" : "tenant";
}

export const useAuthStore = create<AuthState>((set) => ({
  user:             null,
  isAuthenticated:  false,
  sessionType:      null,
  tenantKey:        null,
  isLoading:        false,
  isBootstrapping:  true,
  error:            null,

  /* ── Login ── */
  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const { tokens } = await loginApi(payload);

      const sessionType: SessionType = payload.tenantKey ? "tenant" : "platform";
      const tenantKey = payload.tenantKey ?? null;

      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      tokenStorage.setContext(tenantKey, sessionType);

      // Fetch full user info from /api/auth/me
      const user = await getMeApi();
      const resolvedSession = deriveSessionType(user);
      const resolvedTenantKey = user.tenantKey ?? tenantKey;

      // Ensure tenantKey is updated if backend returned it inside user
      tokenStorage.setContext(resolvedTenantKey, resolvedSession);

      set({
        user: { ...user, sessionType: resolvedSession },
        isAuthenticated: true,
        sessionType:     resolvedSession,
        tenantKey:       resolvedTenantKey,
        isLoading:       false,
        error:           null,
      });
    } catch (err: unknown) {
      tokenStorage.clear();
      const message = extractErrorMessage(err) ?? "Login failed. Please check your credentials.";
      set({ isLoading: false, error: message, isAuthenticated: false, user: null });
      throw err; // re-throw so the form can react
    }
  },

  /* ── Logout ── */
  logout: async () => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch {
      // Even if logout API fails, clear locally
    } finally {
      tokenStorage.clear();
      set({
        user:            null,
        isAuthenticated: false,
        sessionType:     null,
        tenantKey:       null,
        error:           null,
      });
    }
  },

  /* ── Bootstrap — restore session on app load ── */
  bootstrap: async () => {
    set({ isBootstrapping: true });
    const refreshToken = tokenStorage.getRefresh();

    if (!refreshToken) {
      tokenStorage.clear();
      set({ isBootstrapping: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await getMeApi();
      const sessionType   = deriveSessionType(user);
      const resolvedTenant = user.tenantKey ?? tokenStorage.getTenantKey();

      tokenStorage.setContext(resolvedTenant, sessionType);

      set({
        user: { ...user, sessionType },
        isAuthenticated: true,
        sessionType,
        tenantKey:       resolvedTenant,
        isBootstrapping: false,
        error:           null,
      });
    } catch {
      // /me failed and refresh recovery did not produce a valid session.
      // Clear local auth state to avoid stale authenticated UI.
      tokenStorage.clear();
      set({
        user:            null,
        isAuthenticated: false,
        sessionType:     null,
        tenantKey:       null,
        isBootstrapping: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  setUser:    (user) => set({ user }),
}));

/* ── Selectors ── */
export const selectIsAuthenticated  = (s: AuthState) => s.isAuthenticated;
export const selectUser             = (s: AuthState) => s.user;
export const selectSessionType      = (s: AuthState) => s.sessionType;
export const selectTenantKey        = (s: AuthState) => s.tenantKey;
export const selectIsBootstrapping  = (s: AuthState) => s.isBootstrapping;
export const selectAuthError        = (s: AuthState) => s.error;
export const selectAuthLoading      = (s: AuthState) => s.isLoading;

/* ── Helpers ── */
function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message ?? e.message ?? null;
  }
  return null;
}
