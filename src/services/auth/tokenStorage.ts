import type { SessionType } from "@/types";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "wn_access_token",
  REFRESH_TOKEN: "wn_refresh_token",
  CSRF_TOKEN: "wn_csrf_token",
  TENANT_KEY: "wn_tenant_key",
  SESSION_TYPE: "wn_session_type",
  DEVICE_ID: "wn_device_id",
} as const;

type TokenStorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
type SessionTypeValue = SessionType | null;

const memoryStore = new Map<TokenStorageKey, string>();

function getBrowserStorage(kind: "sessionStorage" | "localStorage"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window[kind];
  } catch {
    return null;
  }
}

const sessionStorageRef = getBrowserStorage("sessionStorage");
const localStorageRef = getBrowserStorage("localStorage");
const legacyLocalStorageRef = getBrowserStorage("localStorage");

function readValue(key: TokenStorageKey): string | null {
  const inMemory = memoryStore.get(key);
  if (inMemory !== undefined) {
    return inMemory;
  }

  const persisted = sessionStorageRef?.getItem(key) ?? null;
  if (persisted !== null) {
    memoryStore.set(key, persisted);
  }
  return persisted;
}

function writeValue(key: TokenStorageKey, value: string) {
  memoryStore.set(key, value);
  sessionStorageRef?.setItem(key, value);
}

function removeValue(key: TokenStorageKey) {
  memoryStore.delete(key);
  sessionStorageRef?.removeItem(key);
}

function migrateLegacyLocalStorageData() {
  if (!legacyLocalStorageRef) return;

  (Object.values(STORAGE_KEYS) as TokenStorageKey[]).forEach((key) => {
    if (key === STORAGE_KEYS.DEVICE_ID) {
      return;
    }
    const existing = readValue(key);
    const legacy = legacyLocalStorageRef.getItem(key);

    if (!existing && legacy) {
      writeValue(key, legacy);
    }

    // Remove legacy localStorage tokens to reduce long-lived token exposure.
    legacyLocalStorageRef.removeItem(key);
  });
}

function getOrCreateDeviceId(): string {
  const existing = localStorageRef?.getItem(STORAGE_KEYS.DEVICE_ID);
  if (existing) return existing;

  const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `device-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

  localStorageRef?.setItem(STORAGE_KEYS.DEVICE_ID, generated);
  return generated;
}

migrateLegacyLocalStorageData();

export const tokenStorage = {
  getAccess: () => readValue(STORAGE_KEYS.ACCESS_TOKEN),
  getRefresh: () => readValue(STORAGE_KEYS.REFRESH_TOKEN),
  getCsrf: () => readValue(STORAGE_KEYS.CSRF_TOKEN),
  getTenantKey: () => readValue(STORAGE_KEYS.TENANT_KEY),
  getSession: () => readValue(STORAGE_KEYS.SESSION_TYPE) as SessionTypeValue,
  getDeviceId: () => getOrCreateDeviceId(),

  setTokens: (access: string, refresh?: string) => {
    writeValue(STORAGE_KEYS.ACCESS_TOKEN, access);
    if (refresh) {
      writeValue(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    }
  },

  setCsrf: (csrfToken: string | null | undefined) => {
    if (csrfToken) {
      writeValue(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
      return;
    }
    removeValue(STORAGE_KEYS.CSRF_TOKEN);
  },

  setContext: (tenantKey: string | null, sessionType: SessionType) => {
    if (tenantKey) {
      writeValue(STORAGE_KEYS.TENANT_KEY, tenantKey);
    } else {
      removeValue(STORAGE_KEYS.TENANT_KEY);
    }

    writeValue(STORAGE_KEYS.SESSION_TYPE, sessionType);
  },

  clear: () => {
    (Object.values(STORAGE_KEYS) as TokenStorageKey[]).forEach((key) => {
      if (key === STORAGE_KEYS.DEVICE_ID) {
        return;
      }
      removeValue(key);
    });
    if (legacyLocalStorageRef) {
      (Object.values(STORAGE_KEYS) as TokenStorageKey[]).forEach((key) => {
        if (key === STORAGE_KEYS.DEVICE_ID) {
          return;
        }
        legacyLocalStorageRef.removeItem(key);
      });
    }
  },
};
