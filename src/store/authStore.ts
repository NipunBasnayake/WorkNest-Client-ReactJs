import { create } from "zustand";
import { tokenStorage } from "@/services/http/client";
import { loginApi, getMeApi, logoutApi, isPasswordChangeRequiredApiError } from "@/services/api/authApi";
import type { AuthUser, LoginPayload, SessionType } from "@/types";
import type { PasswordChangeRequirement } from "@/services/api/authApi";

const SESSION_EXPIRED_ROUTE = "/session-expired";

interface AuthState {
  /* State */
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionType: SessionType | null;
  tenantKey: string | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
  passwordChangeRequired: boolean;
  passwordChangeChallenge: PasswordChangeRequirement | null;

  /* Actions */
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
  setPasswordChangeChallenge: (challenge: PasswordChangeRequirement | null) => void;
  applyTokenRefresh: (accessToken: string, refreshToken: string, tenantKey: string | null) => void;
  hardLogout: (redirectTo?: string) => void;
}

function deriveSessionType(user: AuthUser): SessionType {
  if (user.tenantKey) return "tenant";
  const platformRoles = ["PLATFORM_ADMIN", "PLATFORM_USER"];
  return platformRoles.includes(user.role) ? "platform" : "tenant";
}

function redirectTo(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== path) {
    window.location.replace(path);
  }
}

function resolveSessionType(current: SessionType | null, tenantKey: string | null): SessionType {
  return current ?? tokenStorage.getSession() ?? (tenantKey ? "tenant" : "platform");
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:             null,
  isAuthenticated:  false,
  sessionType:      null,
  tenantKey:        null,
  isLoading:        false,
  isBootstrapping:  true,
  error:            null,
  passwordChangeRequired: false,
  passwordChangeChallenge: null,

  /* ── Login ── */
  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const loginResult = await loginApi(payload);

      if (loginResult.kind === "password_change_required") {
        set({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          sessionType: null,
          tenantKey: loginResult.challenge.tenantKey,
          passwordChangeRequired: true,
          passwordChangeChallenge: loginResult.challenge,
          error: loginResult.challenge.reason ?? "Password change is required before continuing.",
        });
        return;
      }

      const { tokens, user: loginUser } = loginResult;

      const sessionType: SessionType = payload.tenantKey ? "tenant" : "platform";
      const tenantKey = payload.tenantKey ?? null;

      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      tokenStorage.setContext(tenantKey, sessionType);

      const user = loginUser ?? await getMeApi();
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
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
    } catch (err: unknown) {
      if (isPasswordChangeRequiredApiError(err)) {
        const challenge = err.challenge;
        set({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          sessionType: null,
          tenantKey: challenge.tenantKey,
          passwordChangeRequired: true,
          passwordChangeChallenge: challenge,
          error: challenge.reason ?? "Password change is required before continuing.",
        });
        return;
      }

      tokenStorage.clear();
      const message = extractErrorMessage(err) ?? "Login failed. Please check your credentials.";
      set({
        isLoading: false,
        error: message,
        isAuthenticated: false,
        user: null,
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
      throw err; // re-throw so the form can react
    }
  },

  /* ── Logout ── */
  logout: async () => {
    const refreshToken = tokenStorage.getRefresh();
    const tenantKey = tokenStorage.getTenantKey();
    try {
      if (refreshToken) {
        await logoutApi(refreshToken, tenantKey);
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
        isLoading:       false,
        isBootstrapping: false,
        error:           null,
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
    }
  },

  /* ── Bootstrap — restore session on app load ── */
  bootstrap: async () => {
    set({ isBootstrapping: true });
    const accessToken = tokenStorage.getAccess();
    const refreshToken = tokenStorage.getRefresh();

    if (!accessToken && !refreshToken) {
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
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
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
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
    }
  },

  clearError: () => set({ error: null }),
  setUser:    (user) => set({ user }),
  setPasswordChangeChallenge: (challenge) => set({
    passwordChangeChallenge: challenge,
    passwordChangeRequired: Boolean(challenge),
    error: challenge?.reason ?? null,
  }),
  applyTokenRefresh: (accessToken, refreshToken, tenantKey) => {
    const state = get();
    const resolvedTenantKey = tenantKey ?? state.tenantKey ?? tokenStorage.getTenantKey();
    const resolvedSessionType = resolveSessionType(state.sessionType, resolvedTenantKey);

    tokenStorage.setTokens(accessToken, refreshToken);
    tokenStorage.setContext(resolvedTenantKey, resolvedSessionType);

    set({
      tenantKey: resolvedTenantKey,
      sessionType: state.sessionType ?? resolvedSessionType,
      error: null,
      passwordChangeRequired: false,
      passwordChangeChallenge: null,
    });
  },
  hardLogout: (redirectToPath = SESSION_EXPIRED_ROUTE) => {
    tokenStorage.clear();
    set({
      user:            null,
      isAuthenticated: false,
      sessionType:     null,
      tenantKey:       null,
      isLoading:       false,
      isBootstrapping: false,
      error:           null,
      passwordChangeRequired: false,
      passwordChangeChallenge: null,
    });
    redirectTo(redirectToPath);
  },
}));

/* ── Selectors ── */
export const selectIsAuthenticated  = (s: AuthState) => s.isAuthenticated;
export const selectUser             = (s: AuthState) => s.user;
export const selectSessionType      = (s: AuthState) => s.sessionType;
export const selectTenantKey        = (s: AuthState) => s.tenantKey;
export const selectIsBootstrapping  = (s: AuthState) => s.isBootstrapping;
export const selectAuthError        = (s: AuthState) => s.error;
export const selectAuthLoading      = (s: AuthState) => s.isLoading;
export const selectPasswordChangeRequired = (s: AuthState) => s.passwordChangeRequired;
export const selectPasswordChangeChallenge = (s: AuthState) => s.passwordChangeChallenge;

/* ── Helpers ── */
function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message ?? e.message ?? null;
  }
  return null;
}
