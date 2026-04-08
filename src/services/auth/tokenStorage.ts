import type { SessionType } from "@/types";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "wn_access_token",
  REFRESH_TOKEN: "wn_refresh_token",
  TENANT_KEY: "wn_tenant_key",
  SESSION_TYPE: "wn_session_type",
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
    const existing = readValue(key);
    const legacy = legacyLocalStorageRef.getItem(key);

    if (!existing && legacy) {
      writeValue(key, legacy);
    }

    // Remove legacy localStorage tokens to reduce long-lived token exposure.
    legacyLocalStorageRef.removeItem(key);
  });
}

migrateLegacyLocalStorageData();

export const tokenStorage = {
  // TODO(security-backend): Move to HttpOnly secure cookies once backend session-cookie support is available.
  // TODO(security-backend): Add server-side token rotation/revocation and CSRF defenses when cookie auth lands.
  getAccess: () => readValue(STORAGE_KEYS.ACCESS_TOKEN),
  getRefresh: () => readValue(STORAGE_KEYS.REFRESH_TOKEN),
  getTenantKey: () => readValue(STORAGE_KEYS.TENANT_KEY),
  getSession: () => readValue(STORAGE_KEYS.SESSION_TYPE) as SessionTypeValue,

  setTokens: (access: string, refresh: string) => {
    writeValue(STORAGE_KEYS.ACCESS_TOKEN, access);
    writeValue(STORAGE_KEYS.REFRESH_TOKEN, refresh);
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
    (Object.values(STORAGE_KEYS) as TokenStorageKey[]).forEach((key) => removeValue(key));
    if (legacyLocalStorageRef) {
      (Object.values(STORAGE_KEYS) as TokenStorageKey[]).forEach((key) => {
        legacyLocalStorageRef.removeItem(key);
      });
    }
  },
};
