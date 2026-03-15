import { publicClient, apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { LoginPayload, AuthTokens, AuthUser, ApiResponse } from "@/types";

type TokenPayload = {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
};

function extractTokens(payload: TokenPayload): AuthTokens {
  if (!payload.accessToken || !payload.refreshToken) {
    throw new Error("Authentication response is missing tokens.");
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
}

export async function loginApi(payload: LoginPayload): Promise<{ tokens: AuthTokens; user?: AuthUser }> {
  const { data } = await publicClient.post<
    ApiResponse<{ accessToken: string; refreshToken: string; user?: AuthUser }> | TokenPayload
  >("/api/auth/login", payload);

  const parsed = unwrapApiData<TokenPayload>(data);
  const tokens = extractTokens(parsed);

  return { tokens, user: parsed.user };
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiResponse<AuthUser> | AuthUser>("/api/auth/me");
  const user = unwrapApiData<AuthUser>(data);

  if (!user?.id) {
    throw new Error("Invalid current-user response received from server.");
  }

  return user;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiClient.post("/api/auth/logout", { refreshToken });
}

export async function refreshTokenApi(refreshToken: string): Promise<AuthTokens> {
  const { data } = await publicClient.post<
    ApiResponse<{ accessToken: string; refreshToken?: string }> | TokenPayload
  >("/api/auth/refresh", { refreshToken });

  const parsed = unwrapApiData<TokenPayload>(data);
  if (!parsed.accessToken) {
    throw new Error("Refresh response is missing accessToken.");
  }

  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken ?? refreshToken,
  };
}
