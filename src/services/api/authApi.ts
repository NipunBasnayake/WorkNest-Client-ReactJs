import axios from "axios";
import { publicClient, apiClient, tokenStorage } from "@/services/http/client";
import { readApiEnvelope, unwrapApiData } from "@/services/http/response";
import type { LoginPayload, AuthTokens, AuthUser, ApiResponse, AuthSession } from "@/types";
import { asRecord, firstDefined, getBoolean, getId, getNumber, getString } from "@/services/http/parsers";
import { getMyEmployeeProfileApi } from "@/services/api/employeeApi";

type TokenPayload = {
  accessToken?: unknown;
  refreshToken?: unknown;
  csrfToken?: unknown;
  sessionId?: unknown;
  user?: unknown;
};

export interface PasswordChangeRequirement {
  email: string;
  tenantKey: string | null;
  challengeToken: string | null;
  reason?: string;
  user?: AuthUser;
}

export type LoginApiResult =
  | { kind: "authenticated"; tokens: AuthTokens; csrfToken?: string; sessionId?: number; user?: AuthUser }
  | { kind: "password_change_required"; challenge: PasswordChangeRequirement };

export type RefreshTokenApiResult = AuthTokens & { csrfToken?: string; sessionId?: number };

export interface ChangeRequiredPasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
  email?: string;
  tenantKey?: string | null;
  challengeToken?: string | null;
}

export interface ChangeRequiredPasswordResult {
  tokens?: AuthTokens;
  user?: AuthUser;
  message?: string;
}

export class PasswordChangeRequiredApiError extends Error {
  challenge: PasswordChangeRequirement;

  constructor(challenge: PasswordChangeRequirement) {
    super(challenge.reason ?? "Password change is required before continuing.");
    this.name = "PasswordChangeRequiredApiError";
    this.challenge = challenge;
  }
}

function extractTokens(payload: TokenPayload): AuthTokens {
  const accessToken = getString(payload.accessToken);

  if (!accessToken) {
    throw new Error("Authentication response is missing an access token.");
  }

  return { accessToken, refreshToken: getString(payload.refreshToken) ?? undefined };
}

function extractOptionalTokens(payload: unknown): AuthTokens | undefined {
  const value = asRecord(payload);
  const nestedTokens = asRecord(firstDefined(value.tokens, value.auth));
  const accessToken = firstDefined(
    getString(value.accessToken),
    getString(nestedTokens.accessToken)
  );
  const refreshToken = firstDefined(
    getString(value.refreshToken),
    getString(nestedTokens.refreshToken)
  );

  if (!accessToken || !refreshToken) return undefined;
  return { accessToken, refreshToken };
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
  const tenantSlug = firstDefined(
    getString(value.tenantSlug),
    getString(value.slug)
  ) ?? tenantKey;

  return {
    id: id || email || "unknown",
    email,
    name,
    role,
    tenantKey,
    tenantSlug,
    avatarUrl: firstDefined(getString(value.avatarUrl), getString(value.profileImageUrl), getString(value.imageUrl)),
  };
}

async function hydrateTenantAvatar(user: AuthUser): Promise<AuthUser> {
  if (!user.tenantSlug && !user.tenantKey) return user;
  try {
    const profile = asRecord(await getMyEmployeeProfileApi());
    return {
      ...user,
      avatarUrl: firstDefined(
        getString(profile.avatarUrl),
        getString(profile.profileImageUrl),
        getString(profile.imageUrl)
      ),
    };
  } catch {
    // Authentication remains valid when a tenant employee mirror is temporarily unavailable.
    return user;
  }
}

function hasPasswordChangeRequirement(value: Record<string, unknown>): boolean {
  const requiredFlag = firstDefined(
    getBoolean(value.passwordChangeRequired),
    getBoolean(value.requiresPasswordChange),
    getBoolean(value.mustChangePassword),
    getBoolean(value.changePasswordRequired)
  );
  if (requiredFlag === true) return true;

  const errorCode = getString(firstDefined(
    value.errorCode,
    value.code,
    asRecord(value.error).code
  ));
  if (errorCode && /PASSWORD.*CHANGE.*REQUIRED/i.test(errorCode)) {
    return true;
  }

  const message = getString(firstDefined(
    value.message,
    asRecord(value.error).message
  ));
  return Boolean(message && message.toLowerCase().includes("password change"));
}

function toPasswordChangeRequirement(raw: unknown, defaults?: Partial<LoginPayload>): PasswordChangeRequirement | null {
  const value = asRecord(raw);
  if (!hasPasswordChangeRequirement(value)) return null;

  const userCandidate = firstDefined(value.user, asRecord(value.data).user);
  const user = userCandidate ? normalizeAuthUser(userCandidate) : undefined;

  return {
    email: firstDefined(
      getString(value.email),
      getString(asRecord(value.user).email),
      defaults?.email,
      user?.email
    ) ?? "",
    tenantKey: firstDefined(
      getString(value.tenantKey),
      getString(asRecord(value.user).tenantKey),
      defaults?.tenantKey ?? undefined,
      user?.tenantKey ?? undefined
    ) ?? null,
    challengeToken: firstDefined(
      getString(value.challengeToken),
      getString(value.passwordChangeToken),
      getString(value.changePasswordToken),
      getString(value.token),
      getString(asRecord(value.data).challengeToken)
    ) ?? null,
    reason: firstDefined(
      getString(value.message),
      getString(asRecord(value.error).message)
    ) ?? undefined,
    user,
  };
}

function extractRequirementFromError(error: unknown, defaults?: Partial<LoginPayload>): PasswordChangeRequirement | null {
  if (!axios.isAxiosError(error)) return null;
  const status = error.response?.status;
  if (!status || ![401, 403, 409, 422, 428].includes(status)) return null;

  const responsePayload = error.response?.data as ApiResponse<unknown> | unknown;
  if (!responsePayload) return null;

  const direct = toPasswordChangeRequirement(responsePayload, defaults);
  if (direct) return direct;

  const unwrapped = readApiEnvelope<unknown>(responsePayload).data;
  return toPasswordChangeRequirement(unwrapped, defaults);
}

export function isPasswordChangeRequiredApiError(error: unknown): error is PasswordChangeRequiredApiError {
  return error instanceof PasswordChangeRequiredApiError;
}

export async function loginApi(payload: LoginPayload): Promise<LoginApiResult> {
  try {
    const { data } = await publicClient.post<
      ApiResponse<{ accessToken?: unknown; refreshToken?: unknown; user?: unknown }> | TokenPayload
    >("/api/auth/login", payload);

    const envelope = readApiEnvelope<unknown>(data);
    const parsed = asRecord(envelope.data);
    const challenge = toPasswordChangeRequirement(
      {
        ...asRecord(data),
        ...parsed,
      },
      payload
    );

    if (challenge) {
      return { kind: "password_change_required", challenge };
    }

    const tokens = extractTokens(parsed as TokenPayload);
    const user = parsed.user ? normalizeAuthUser(parsed.user) : undefined;

    return {
      kind: "authenticated",
      tokens,
      csrfToken: getString(parsed.csrfToken) ?? getString(asRecord(data).csrfToken) ?? undefined,
      sessionId: getNumber(firstDefined(parsed.sessionId, asRecord(data).sessionId)) ?? undefined,
      user,
    };
  } catch (error) {
    const challenge = extractRequirementFromError(error, payload);
    if (challenge) {
      throw new PasswordChangeRequiredApiError(challenge);
    }
    throw error;
  }
}

export async function forgotPasswordApi(email: string, tenantKey?: string | null): Promise<void> {
  await publicClient.post<ApiResponse<unknown> | unknown>("/api/auth/forgot-password", {
    email: email.trim(),
    ...(tenantKey ? { tenantKey } : {}),
  });
}

export async function resetPasswordApi(token: string, newPassword: string, confirmPassword?: string): Promise<void> {
  await publicClient.post<ApiResponse<unknown> | unknown>("/api/auth/reset-password", {
    token,
    newPassword,
    confirmPassword: confirmPassword ?? newPassword,
  });
}

async function submitRequiredPasswordChange(
  endpoint: string,
  payload: ChangeRequiredPasswordPayload
): Promise<ChangeRequiredPasswordResult> {
  const requestPayload = {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword ?? payload.newPassword,
    ...(payload.challengeToken ? { token: payload.challengeToken, challengeToken: payload.challengeToken } : {}),
    ...(payload.email ? { email: payload.email } : {}),
    ...(payload.tenantKey ? { tenantKey: payload.tenantKey } : {}),
  };

  const { data } = await publicClient.post<ApiResponse<unknown> | unknown>(endpoint, requestPayload);
  const envelope = readApiEnvelope<unknown>(data);
  const responsePayload = asRecord(envelope.data);
  const tokens = extractOptionalTokens(responsePayload);
  const userCandidate = firstDefined(responsePayload.user, asRecord(responsePayload.data).user);
  const user = userCandidate ? normalizeAuthUser(userCandidate) : undefined;

  return {
    tokens,
    user,
    message: firstDefined(
      envelope.message,
      getString(responsePayload.message)
    ) ?? undefined,
  };
}

export async function changeRequiredPasswordApi(payload: ChangeRequiredPasswordPayload): Promise<ChangeRequiredPasswordResult> {
  const endpoints = [
    "/api/auth/change-password-required",
    "/api/auth/change-password",
    "/api/auth/password/change-required",
  ];

  let lastNotFoundError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      return await submitRequiredPasswordChange(endpoint, payload);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        lastNotFoundError = error;
        continue;
      }
      throw error;
    }
  }

  if (lastNotFoundError) {
    throw lastNotFoundError;
  }

  throw new Error("Unable to change password right now.");
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/auth/me");
  const user = normalizeAuthUser(unwrapApiData<unknown>(data));

  if (!user.id) {
    throw new Error("Invalid current-user response received from server.");
  }

  return hydrateTenantAvatar(user);
}

export async function logoutApi(tenantKey?: string | null): Promise<void> {
  await apiClient.post("/api/auth/logout", {
    ...(tenantKey ? { tenantKey } : {}),
    ...(tokenStorage.getRefresh() ? { refreshToken: tokenStorage.getRefresh() } : {}),
  });
}

export async function refreshTokenApi(tenantKey?: string | null): Promise<RefreshTokenApiResult> {
  const { data } = await publicClient.post<
    ApiResponse<{ accessToken: string; csrfToken?: string; sessionId?: number }> | TokenPayload
  >("/api/auth/refresh", {
    ...(tenantKey ? { tenantKey } : {}),
    ...(tokenStorage.getRefresh() ? { refreshToken: tokenStorage.getRefresh() } : {}),
  });

  const parsed = unwrapApiData<TokenPayload>(data);
  if (!getString(parsed.accessToken)) {
    throw new Error("Refresh response is missing accessToken.");
  }

  return {
    accessToken: getString(parsed.accessToken)!,
    refreshToken: getString(parsed.refreshToken) ?? undefined,
    csrfToken: getString(parsed.csrfToken) ?? undefined,
    sessionId: getNumber(parsed.sessionId) ?? undefined,
  };
}

type SessionPayload = {
  sessions?: unknown;
};

export async function getActiveSessionsApi(): Promise<AuthSession[]> {
  const { data } = await apiClient.get<ApiResponse<SessionPayload> | SessionPayload>("/api/auth/sessions");
  const payload = unwrapApiData<SessionPayload>(data);
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];

  return sessions.map((session) => {
    const value = asRecord(session);
    return {
      id: getNumber(value.id) ?? 0,
      deviceId: getString(value.deviceId) ?? null,
      deviceName: getString(value.deviceName) ?? null,
      userAgent: getString(value.userAgent) ?? null,
      ipAddress: getString(value.ipAddress) ?? null,
      suspicious: Boolean(value.suspicious),
      suspiciousReason: getString(value.suspiciousReason) ?? null,
      createdAt: getString(value.createdAt) ?? undefined,
      lastUsedAt: getString(value.lastUsedAt) ?? undefined,
      expiresAt: getString(value.expiresAt) ?? undefined,
      revoked: Boolean(value.revoked),
      currentSession: Boolean(value.currentSession),
    } satisfies AuthSession;
  });
}

export async function revokeSessionApi(sessionId: number): Promise<void> {
  await apiClient.delete(`/api/auth/sessions/${sessionId}`);
}

export async function revokeOtherSessionsApi(): Promise<void> {
  await apiClient.post("/api/auth/sessions/revoke-others", {});
}
