export interface AppEnv {
  apiBaseUrl: string;
  websocketUrl?: string;
  realtimeDisabled: boolean;
  mode: string;
  isDevelopment: boolean;
}

declare global {
  interface Window {
    __WORKNEST_CONFIG__?: Partial<Record<"API_BASE_URL" | "WS_URL" | "REALTIME_DISABLED", string>>;
  }
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("VITE_API_BASE_URL is required but was empty.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error(`VITE_API_BASE_URL must be a valid absolute URL. Received "${raw}".`);
  }

  const normalized = parsedUrl.toString().replace(/\/+$/, "");
  if (!normalized) {
    throw new Error("VITE_API_BASE_URL resolved to an empty URL.");
  }

  return normalized;
}

function readRuntimeConfig(key: "API_BASE_URL" | "WS_URL" | "REALTIME_DISABLED"): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = window.__WORKNEST_CONFIG__?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readViteEnv(key: "VITE_API_BASE_URL" | "VITE_WS_URL" | "VITE_REALTIME_DISABLED"): string | undefined {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readApiBaseUrl(): string {
  const value = readRuntimeConfig("API_BASE_URL") ?? readViteEnv("VITE_API_BASE_URL");
  if (value) {
    return normalizeBaseUrl(value);
  }

  throw new Error(
    "Missing required environment variable VITE_API_BASE_URL. Add it to your .env before starting WorkNest."
  );
}

function readOptionalAbsoluteUrl(
  runtimeKey: "WS_URL",
  viteKey: "VITE_WS_URL",
): string | undefined {
  const value = readRuntimeConfig(runtimeKey) ?? readViteEnv(viteKey);
  if (!value) return undefined;
  return normalizeBaseUrl(value);
}

function readBoolean(runtimeKey: "REALTIME_DISABLED", viteKey: "VITE_REALTIME_DISABLED"): boolean {
  const value = readRuntimeConfig(runtimeKey) ?? readViteEnv(viteKey);
  return value?.toLowerCase() === "true";
}

function buildEnv(): AppEnv {
  const mode = import.meta.env.MODE ?? "development";

  return {
    apiBaseUrl: readApiBaseUrl(),
    websocketUrl: readOptionalAbsoluteUrl("WS_URL", "VITE_WS_URL"),
    realtimeDisabled: readBoolean("REALTIME_DISABLED", "VITE_REALTIME_DISABLED"),
    mode,
    isDevelopment: mode === "development",
  };
}

export function readAppEnv(): AppEnv {
  return buildEnv();
}

export const ENV: AppEnv = readAppEnv();
