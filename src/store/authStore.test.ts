import { beforeEach, describe, expect, it, vi } from "vitest";

const authApiMocks = vi.hoisted(() => ({
  loginApi: vi.fn(),
  getMeApi: vi.fn(),
  logoutApi: vi.fn(),
}));

vi.mock("@/services/api/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api/authApi")>();
  return {
    ...actual,
    loginApi: authApiMocks.loginApi,
    getMeApi: authApiMocks.getMeApi,
    logoutApi: authApiMocks.logoutApi,
  };
});

import { tokenStorage } from "@/services/http/client";
import { useAuthStore } from "@/store/authStore";

const platformUser = {
  id: "1",
  email: "platform.admin@worknest.local",
  name: "Platform Admin",
  role: "PLATFORM_ADMIN",
  tenantKey: null,
  tenantSlug: null,
};

describe("forced password change auth state", () => {
  beforeEach(() => {
    authApiMocks.loginApi.mockReset();
    authApiMocks.getMeApi.mockReset();
    authApiMocks.logoutApi.mockReset();
    tokenStorage.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      sessionType: null,
      tenantKey: null,
      isLoading: false,
      isBootstrapping: false,
      authReady: true,
      error: null,
      passwordChangeRequired: false,
      passwordChangeChallenge: null,
    });
  });

  it("stores the restricted first-login session instead of discarding it", async () => {
    authApiMocks.loginApi.mockResolvedValue({
      kind: "password_change_required",
      tokens: { accessToken: "first-access", refreshToken: "first-refresh" },
      csrfToken: "first-csrf",
      sessionId: 10,
      challenge: {
        email: platformUser.email,
        tenantKey: null,
        challengeToken: null,
        user: { ...platformUser, passwordChangeRequired: true },
      },
    });

    await useAuthStore.getState().login({
      email: platformUser.email,
      password: "ChangeMe123!",
      tenantKey: null,
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.passwordChangeRequired).toBe(true);
    expect(state.sessionType).toBe("platform");
    expect(tokenStorage.getAccess()).toBe("first-access");
    expect(tokenStorage.getRefresh()).toBe("first-refresh");
    expect(tokenStorage.getCsrf()).toBe("first-csrf");
  });

  it("restores the forced-change state after a browser reload", async () => {
    tokenStorage.setTokens("first-access", "first-refresh");
    tokenStorage.setContext(null, "platform");
    authApiMocks.getMeApi.mockResolvedValue({ ...platformUser, passwordChangeRequired: true });

    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.passwordChangeRequired).toBe(true);
    expect(state.passwordChangeChallenge?.email).toBe(platformUser.email);
  });

  it("replaces the restricted tokens and completes authentication", async () => {
    tokenStorage.setTokens("first-access", "first-refresh");
    useAuthStore.setState({
      tenantKey: null,
      sessionType: "platform",
      isAuthenticated: true,
      passwordChangeRequired: true,
      passwordChangeChallenge: {
        email: platformUser.email,
        tenantKey: null,
        challengeToken: null,
      },
    });
    authApiMocks.getMeApi.mockResolvedValue({ ...platformUser, passwordChangeRequired: false });

    await useAuthStore.getState().completePasswordChange({
      tokens: { accessToken: "replacement-access", refreshToken: "replacement-refresh" },
      csrfToken: "replacement-csrf",
      sessionId: 11,
      user: { ...platformUser, passwordChangeRequired: false },
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.passwordChangeRequired).toBe(false);
    expect(tokenStorage.getAccess()).toBe("replacement-access");
    expect(tokenStorage.getRefresh()).toBe("replacement-refresh");
    expect(tokenStorage.getCsrf()).toBe("replacement-csrf");
  });
});
