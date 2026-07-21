import { create } from "zustand";
import { tokenStorage } from "@/services/http/client";
import { loginApi, getMeApi, logoutApi, isPasswordChangeRequiredApiError } from "@/services/api/authApi";
import type { AuthUser, LoginPayload, SessionType } from "@/types";
import type { ChangeRequiredPasswordResult, PasswordChangeRequirement } from "@/services/api/authApi";
import { getErrorMessage } from "@/utils/errorHandler";

const LOGIN_ROUTE = "/login";
let bootstrapInFlight: Promise<void> | null = null;

/**
 * Broadcast channel name used to synchronise logout across browser tabs.
 * When one tab logs out, all other tabs receive the signal and clear their session too.
 */
const AUTH_BROADCAST_CHANNEL = "worknest:auth";

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (broadcastChannel) return broadcastChannel;
  try {
    broadcastChannel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    return broadcastChannel;
  } catch {
    return null;
  }
}

function broadcastLogout() {
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({ type: "logout", timestamp: Date.now() });
  }
}

function listenForBroadcastLogout(onLogout: () => void): () => void {
  const channel = getBroadcastChannel();
  if (!channel) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data?.type === "logout") {
      onLogout();
    }
  };

  channel.addEventListener("message", handler);
  return () => {
    channel.removeEventListener("message", handler);
  };
}

interface AuthState {
  /* State */
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionType: SessionType | null;
  tenantKey: string | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  authReady: boolean;
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
  completePasswordChange: (result: ChangeRequiredPasswordResult) => Promise<void>;
  applyTokenRefresh: (accessToken: string, tenantKey: string | null) => void;
  hardLogout: (redirectTo?: string) => void;
}

function deriveSessionType(user: AuthUser): SessionType {
  if (user.tenantSlug || user.tenantKey) return "tenant";
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

function hasStoredSessionArtifact(): boolean {
  return Boolean(tokenStorage.getAccess() || tokenStorage.getRefresh() || tokenStorage.getCsrf());
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:             null,
  isAuthenticated:  false,
  sessionType:      null,
  tenantKey:        null,
  isLoading:        false,
  isBootstrapping:  true,
  authReady:        false,
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
      const csrfToken = loginResult.csrfToken ?? null;

      const sessionType: SessionType = payload.tenantKey ? "tenant" : "platform";
      const tenantKey = payload.tenantKey ?? null;

      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      tokenStorage.setCsrf(csrfToken);
      tokenStorage.setContext(tenantKey, sessionType);

      const user = await getMeApi().catch((error: unknown) => {
        if (loginUser) return loginUser;
        throw error;
      });
      const resolvedSession = deriveSessionType(user);
      const resolvedTenantKey = user.tenantSlug ?? user.tenantKey ?? tenantKey;

      // Ensure tenantKey is updated if backend returned it inside user
      tokenStorage.setContext(resolvedTenantKey, resolvedSession);

      set({
        user: { ...user, sessionType: resolvedSession },
        isAuthenticated: true,
        sessionType:     resolvedSession,
        tenantKey:       resolvedTenantKey,
        isLoading:       false,
        authReady:       true,
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
      const message = getErrorMessage(err, "Login failed. Please check your credentials.");
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
    const tenantKey = tokenStorage.getTenantKey();
    let logoutWarning: string | null = null;
    try {
      await logoutApi(tenantKey);
    } catch {
      logoutWarning = "Logout request failed on the server, but your local session has been cleared.";
    } finally {
      tokenStorage.clear();
      set({
        user:            null,
        isAuthenticated: false,
        sessionType:     null,
        tenantKey:       null,
        isLoading:       false,
        isBootstrapping: false,
        error:           logoutWarning,
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
      /* Notify other tabs that the session has ended */
      broadcastLogout();
    }
  },

  /* ── Bootstrap — restore session on app load, with cross-tab logout sync ── */
  bootstrap: async () => {
    if (bootstrapInFlight) {
      return bootstrapInFlight;
    }

    bootstrapInFlight = (async () => {
      const hadStoredSession = hasStoredSessionArtifact();
      set({ isBootstrapping: true, error: null });

      if (!hadStoredSession) {
        tokenStorage.clear();
        set({
          user:            null,
          isAuthenticated: false,
          sessionType:     null,
          tenantKey:       null,
          isBootstrapping: false,
          authReady:       true,
          error:           null,
          passwordChangeRequired: false,
          passwordChangeChallenge: null,
        });
        return;
      }

      try {
        const user = await getMeApi();
        const sessionType   = deriveSessionType(user);
        const resolvedTenant = user.tenantSlug ?? user.tenantKey ?? tokenStorage.getTenantKey();

        tokenStorage.setContext(resolvedTenant, sessionType);

        set({
          user: { ...user, sessionType },
          isAuthenticated: true,
          sessionType,
          tenantKey:       resolvedTenant,
          isBootstrapping: false,
          authReady:       true,
          error:           null,
          passwordChangeRequired: false,
          passwordChangeChallenge: null,
        });
      } catch (err: unknown) {
        // /me failed and refresh recovery did not produce a valid session.
        // Clear local auth state. Route guards own login redirects for protected
        // screens; public careers pages must remain available even when a browser
        // contains expired session artifacts.
        tokenStorage.clear();
        set({
          user:            null,
          isAuthenticated: false,
          sessionType:     null,
          tenantKey:       null,
          isBootstrapping: false,
          authReady:       true,
          error: getErrorMessage(err, "Your previous session could not be restored. Please sign in again."),
          passwordChangeRequired: false,
          passwordChangeChallenge: null,
        });
      }
    })();

    try {
      await bootstrapInFlight;
    } finally {
      bootstrapInFlight = null;
    }
  },

  clearError: () => set({ error: null }),
  setUser:    (user) => set({ user }),
  setPasswordChangeChallenge: (challenge) => set({
    passwordChangeChallenge: challenge,
    passwordChangeRequired: Boolean(challenge),
    error: challenge?.reason ?? null,
  }),
  completePasswordChange: async (result) => {
    const state = get();
    const challengeTenantKey = state.passwordChangeChallenge?.tenantKey ?? state.tenantKey ?? tokenStorage.getTenantKey();

    if (!result.tokens) {
      tokenStorage.clear();
      set({
        user: null,
        isAuthenticated: false,
        sessionType: null,
        tenantKey: challengeTenantKey,
        isLoading: false,
        error: null,
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
      return;
    }

    try {
      tokenStorage.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      tokenStorage.setCsrf(null);

      const provisionalSessionType: SessionType = challengeTenantKey ? "tenant" : "platform";
      tokenStorage.setContext(challengeTenantKey, provisionalSessionType);

      const user = await getMeApi().catch((error: unknown) => {
        if (result.user) return result.user;
        throw error;
      });
      const resolvedSession = deriveSessionType(user);
      const resolvedTenantKey = user.tenantSlug ?? user.tenantKey ?? challengeTenantKey;

      tokenStorage.setContext(resolvedTenantKey, resolvedSession);

      set({
        user: { ...user, sessionType: resolvedSession },
        isAuthenticated: true,
        sessionType: resolvedSession,
        tenantKey: resolvedTenantKey,
        isLoading: false,
        authReady: true,
        error: null,
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
    } catch (err: unknown) {
      tokenStorage.clear();
      set({
        user: null,
        isAuthenticated: false,
        sessionType: null,
        tenantKey: challengeTenantKey,
        isLoading: false,
        error: getErrorMessage(err, "Password was updated, but the session could not be restored. Please sign in again."),
        passwordChangeRequired: false,
        passwordChangeChallenge: null,
      });
      throw err;
    }
  },
  applyTokenRefresh: (accessToken, tenantKey) => {
    const state = get();
    const resolvedTenantKey = tenantKey ?? state.tenantKey ?? tokenStorage.getTenantKey();
    const resolvedSessionType = resolveSessionType(state.sessionType, resolvedTenantKey);

    tokenStorage.setTokens(accessToken);
    tokenStorage.setContext(resolvedTenantKey, resolvedSessionType);

    set({
      tenantKey: resolvedTenantKey,
      sessionType: state.sessionType ?? resolvedSessionType,
      error: null,
      passwordChangeRequired: false,
      passwordChangeChallenge: null,
    });
  },
  hardLogout: (redirectToPath = LOGIN_ROUTE) => {
    tokenStorage.clear();
    set({
      user:            null,
      isAuthenticated: false,
      sessionType:     null,
      tenantKey:       null,
      isLoading:       false,
      isBootstrapping: false,
      authReady:       true,
      error:           null,
      passwordChangeRequired: false,
      passwordChangeChallenge: null,
    });
    /* Notify other tabs that the session has ended */
    broadcastLogout();
    redirectTo(redirectToPath);
  },
}));

/* ── Cross-tab logout synchronisation ── */
/* Set up a BroadcastChannel listener once after the store module is loaded.
   When another tab logs out, this tab receives the signal and clears its
   session too, redirecting to login. */
if (typeof window !== "undefined") {
  queueMicrotask(() => {
    listenForBroadcastLogout(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) return;
      tokenStorage.clear();
      state.hardLogout(LOGIN_ROUTE);
    });
  });
}

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

