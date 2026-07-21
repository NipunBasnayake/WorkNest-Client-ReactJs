import { beforeEach, describe, expect, it, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({
  publicPost: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/services/http/client", () => ({
  publicClient: { post: clientMocks.publicPost },
  apiClient: { post: clientMocks.apiPost },
  tokenStorage: {
    getRefresh: vi.fn(),
  },
}));

vi.mock("@/services/api/employeeApi", () => ({
  getMyEmployeeProfileApi: vi.fn(),
}));

import { changeRequiredPasswordApi, loginApi } from "@/services/api/authApi";

describe("forced password change API flow", () => {
  beforeEach(() => {
    clientMocks.publicPost.mockReset();
    clientMocks.apiPost.mockReset();
  });

  it("retains the first-login tokens when the backend requires a password change", async () => {
    clientMocks.publicPost.mockResolvedValue({
      data: {
        success: true,
        message: "Login successful",
        data: {
          accessToken: "first-access",
          refreshToken: "first-refresh",
          csrfToken: "first-csrf",
          sessionId: 10,
          passwordChangeRequired: true,
          user: {
            id: 1,
            email: "platform.admin@worknest.local",
            fullName: "Platform Admin",
            role: "PLATFORM_ADMIN",
            passwordChangeRequired: true,
          },
        },
      },
    });

    const result = await loginApi({
      email: "platform.admin@worknest.local",
      password: "ChangeMe123!",
      tenantKey: null,
    });

    expect(result.kind).toBe("password_change_required");
    if (result.kind === "password_change_required") {
      expect(result.tokens).toEqual({ accessToken: "first-access", refreshToken: "first-refresh" });
      expect(result.csrfToken).toBe("first-csrf");
      expect(result.challenge.user?.passwordChangeRequired).toBe(true);
    }
  });

  it("uses the authenticated endpoint and returns the replacement token pair", async () => {
    clientMocks.apiPost.mockResolvedValue({
      data: {
        success: true,
        message: "Password changed successfully.",
        data: {
          accessToken: "replacement-access",
          refreshToken: "replacement-refresh",
          csrfToken: "replacement-csrf",
          sessionId: 11,
          user: {
            id: 1,
            email: "platform.admin@worknest.local",
            fullName: "Platform Admin",
            role: "PLATFORM_ADMIN",
            passwordChangeRequired: false,
          },
        },
      },
    });

    const result = await changeRequiredPasswordApi({
      currentPassword: "ChangeMe123!",
      newPassword: "NewSecure456!",
      confirmPassword: "NewSecure456!",
      email: "platform.admin@worknest.local",
      tenantKey: null,
    });

    expect(clientMocks.apiPost).toHaveBeenCalledWith(
      "/api/auth/change-password-required",
      expect.objectContaining({
        currentPassword: "ChangeMe123!",
        newPassword: "NewSecure456!",
        confirmPassword: "NewSecure456!",
      }),
    );
    expect(result.tokens).toEqual({ accessToken: "replacement-access", refreshToken: "replacement-refresh" });
    expect(result.csrfToken).toBe("replacement-csrf");
    expect(result.user?.passwordChangeRequired).toBe(false);
  });
});
