import { publicClient, apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { LoginPayload, AuthTokens, AuthUser, ApiResponse } from "@/types";
import { asRecord, firstDefined, getId, getString } from "@/services/http/parsers";

type TokenPayload = {
  accessToken: string;
  refreshToken?: string;
  user?: unknown;
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

function normalizeAuthUser(input: unknown): AuthUser {
  const value = asRecord(input);

  const firstName = getString(value.firstName);
  const lastName = getString(value.lastName);
  const derivedName = `${firstName ?? ""} ${lastName ?? ""}`.trim();

  const id = getId(firstDefined(value.id, value.userId, value.employeeId));
  const email = getString(value.email) ?? "";
  const name = firstDefined(
    getString(value.name),
    getString(value.fullName),
    derivedName || undefined,
    email || undefined
  ) ?? "User";
  const role = firstDefined(
    getString(value.role),
    getString(value.userRole)
  ) ?? "EMPLOYEE";
  const tenantKey = firstDefined(
    getString(value.tenantKey),
    getString(value.tenantId),
    getString(value.tenant)
  ) ?? null;

  return {
    id: id || email || "unknown",
    email,
    name,
    role,
    tenantKey,
  };
}

export async function loginApi(payload: LoginPayload): Promise<{ tokens: AuthTokens; user?: AuthUser }> {
  const { data } = await publicClient.post<
    ApiResponse<{ accessToken: string; refreshToken: string; user?: unknown }> | TokenPayload
  >("/api/auth/login", payload);

  const parsed = unwrapApiData<TokenPayload>(data);
  const tokens = extractTokens(parsed);
  const user = parsed.user ? normalizeAuthUser(parsed.user) : undefined;

  return { tokens, user };
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/auth/me");
  const user = normalizeAuthUser(unwrapApiData<unknown>(data));

  if (!user.id) {
    throw new Error("Invalid current-user response received from server.");
  }

  return user;
}

export async function logoutApi(refreshToken: string, tenantKey?: string | null): Promise<void> {
  await apiClient.post("/api/auth/logout", {
    refreshToken,
    ...(tenantKey ? { tenantKey } : {}),
  });
}

export async function refreshTokenApi(refreshToken: string, tenantKey?: string | null): Promise<AuthTokens> {
  const { data } = await publicClient.post<
    ApiResponse<{ accessToken: string; refreshToken?: string }> | TokenPayload
  >("/api/auth/refresh", {
    refreshToken,
    ...(tenantKey ? { tenantKey } : {}),
  });

  const parsed = unwrapApiData<TokenPayload>(data);
  if (!parsed.accessToken) {
    throw new Error("Refresh response is missing accessToken.");
  }

  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken ?? refreshToken,
  };
}
