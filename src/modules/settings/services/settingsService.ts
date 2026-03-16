import { apiClient, tokenStorage } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { getMeApi } from "@/services/api/authApi";
import { getMyEmployeeProfileApi } from "@/services/api/employeeApi";
import { asRecord, firstDefined, getId, getString, toIsoDate } from "@/services/http/parsers";
import type {
  PlatformSettings,
  PreferenceSettings,
  ProfileSettings,
  TenantSettingsBundle,
  WorkspaceSettings,
} from "@/modules/settings/types";
import type { ApiResponse, AuthUser } from "@/types";

const TENANT_PREFERENCES_ROOT = "wn_local_tenant_preferences";
const PLATFORM_SETTINGS_KEY = "wn_local_platform_settings";
const LATENCY_MS = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function normalizeProfile(employeeRaw: unknown, authUser: AuthUser | null): ProfileSettings {
  const employee = asRecord(employeeRaw);
  const firstName = getString(firstDefined(employee.firstName, employee.first_name));
  const lastName = getString(firstDefined(employee.lastName, employee.last_name));
  const derivedName = `${firstName ?? ""} ${lastName ?? ""}`.trim();

  return {
    fullName:
      firstDefined(
        getString(employee.fullName),
        getString(employee.name),
        derivedName || undefined,
        authUser?.name
      ) ?? "Workspace User",
    email:
      firstDefined(
        getString(employee.email),
        authUser?.email
      ) ?? "",
    title:
      firstDefined(
        getString(employee.designation),
        getString(employee.position),
        getString(employee.title)
      ) ?? "",
  };
}

function fallbackWorkspace(tenantKey: string): WorkspaceSettings {
  return {
    workspaceName: tenantKey ? `${tenantKey.toUpperCase()} Workspace` : "Workspace",
    tenantKey,
    status: "ACTIVE",
    createdAt: "",
    dataSource: "inferred",
  };
}

async function resolveWorkspace(authUser: AuthUser | null): Promise<WorkspaceSettings> {
  const tenantKey = authUser?.tenantKey ?? tokenStorage.getTenantKey() ?? "";
  if (!tenantKey) return fallbackWorkspace("");

  try {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/platform/tenants/${tenantKey}`);
    const payload = asRecord(unwrapApiData<unknown>(data));
    return {
      workspaceName:
        firstDefined(getString(payload.companyName), getString(payload.name), tenantKey.toUpperCase()) ?? "Workspace",
      tenantKey: firstDefined(getString(payload.tenantKey), tenantKey) ?? tenantKey,
      status: (getString(payload.status) ?? "ACTIVE").toUpperCase(),
      createdAt: toIsoDate(firstDefined(payload.createdAt, payload.createdDate)),
      databaseName: getString(payload.databaseName),
      dataSource: "backend",
    };
  } catch {
    return fallbackWorkspace(tenantKey);
  }
}

function defaultTenantPreferences(): PreferenceSettings {
  return {
    theme: "system",
    emailNotifications: true,
    pushNotifications: true,
    dailyDigest: true,
  };
}

function preferenceStorageKey(tenantKey: string, userId: string): string {
  return `${TENANT_PREFERENCES_ROOT}_${tenantKey || "default"}_${userId || "me"}`;
}

function readTenantPreferences(tenantKey: string, userId: string): PreferenceSettings {
  const raw = localStorage.getItem(preferenceStorageKey(tenantKey, userId));
  if (!raw) return defaultTenantPreferences();

  try {
    const parsed = JSON.parse(raw) as PreferenceSettings;
    return { ...defaultTenantPreferences(), ...parsed };
  } catch {
    return defaultTenantPreferences();
  }
}

function writeTenantPreferences(tenantKey: string, userId: string, preferences: PreferenceSettings) {
  localStorage.setItem(preferenceStorageKey(tenantKey, userId), JSON.stringify(preferences));
}

function defaultPlatformSettings(): PlatformSettings {
  return {
    platformName: "WorkNest Platform",
    supportEmail: "support@worknest.app",
    maintenanceMode: false,
    auditLogsRetentionDays: 90,
  };
}

function readPlatformSettings(): PlatformSettings {
  const raw = localStorage.getItem(PLATFORM_SETTINGS_KEY);
  if (!raw) return defaultPlatformSettings();

  try {
    const parsed = JSON.parse(raw) as PlatformSettings;
    return { ...defaultPlatformSettings(), ...parsed };
  } catch {
    return defaultPlatformSettings();
  }
}

function writePlatformSettings(data: PlatformSettings) {
  localStorage.setItem(PLATFORM_SETTINGS_KEY, JSON.stringify(data));
}

async function getCurrentAuthUserSafe(): Promise<AuthUser | null> {
  try {
    return await getMeApi();
  } catch {
    return null;
  }
}

async function getMyProfileSafe(): Promise<unknown | null> {
  try {
    return await getMyEmployeeProfileApi();
  } catch {
    return null;
  }
}

async function updateMyProfile(payload: {
  firstName: string;
  lastName: string;
  designation: string;
  password?: string;
}): Promise<unknown> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>("/api/tenant/employees/me", payload);
  return unwrapApiData<unknown>(data);
}

export async function getTenantSettings(): Promise<TenantSettingsBundle> {
  const [authUser, profileRaw] = await Promise.all([
    getCurrentAuthUserSafe(),
    getMyProfileSafe(),
  ]);

  const workspace = await resolveWorkspace(authUser);
  const profile = normalizeProfile(profileRaw, authUser);
  const userId = getId(firstDefined(asRecord(profileRaw).id, authUser?.id, "me"));
  const preferences = readTenantPreferences(workspace.tenantKey, userId);

  return { profile, workspace, preferences };
}

export async function updateTenantProfile(profile: ProfileSettings): Promise<ProfileSettings> {
  const nameParts = splitFullName(profile.fullName);
  const payload = {
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    designation: profile.title.trim(),
  };

  const updated = await updateMyProfile(payload);
  const authUser = await getCurrentAuthUserSafe();
  return normalizeProfile(updated, authUser);
}

export async function updateTenantPassword(password: string): Promise<void> {
  const currentProfile = asRecord(await getMyEmployeeProfileApi());
  const firstName = getString(firstDefined(currentProfile.firstName, currentProfile.first_name)) ?? "";
  const lastName = getString(firstDefined(currentProfile.lastName, currentProfile.last_name)) ?? "";
  const designation =
    firstDefined(getString(currentProfile.designation), getString(currentProfile.position)) ?? "";

  await updateMyProfile({
    firstName,
    lastName,
    designation,
    password,
  });
}

export async function updateTenantWorkspace(workspace: WorkspaceSettings): Promise<WorkspaceSettings> {
  await sleep(LATENCY_MS);
  return workspace;
}

export async function updateTenantPreferences(preferences: PreferenceSettings): Promise<PreferenceSettings> {
  await sleep(LATENCY_MS);

  const authUser = await getCurrentAuthUserSafe();
  const profileRaw = await getMyProfileSafe();
  const tenantKey = authUser?.tenantKey ?? tokenStorage.getTenantKey() ?? "default";
  const userId = getId(firstDefined(asRecord(profileRaw).id, authUser?.id, "me"));
  writeTenantPreferences(tenantKey, userId, preferences);

  return preferences;
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  await sleep(LATENCY_MS);
  return readPlatformSettings();
}

export async function updatePlatformSettings(settings: PlatformSettings): Promise<PlatformSettings> {
  await sleep(LATENCY_MS);
  writePlatformSettings(settings);
  return settings;
}
