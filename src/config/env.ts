interface AppEnv {
  apiBaseUrl: string;
  mode: string;
  isDevelopment: boolean;
}

const DEFAULT_TEST_API_BASE_URL = "http://localhost:8080";

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

function readApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL;
  if (typeof value === "string" && value.trim()) {
    return normalizeBaseUrl(value);
  }

  if (import.meta.env.MODE === "test") {
    return DEFAULT_TEST_API_BASE_URL;
  }

  throw new Error(
    "Missing required environment variable VITE_API_BASE_URL. Add it to your .env before starting WorkNest."
  );
}

function buildEnv(): AppEnv {
  const mode = import.meta.env.MODE ?? "development";

  return {
    apiBaseUrl: readApiBaseUrl(),
    mode,
    isDevelopment: mode === "development",
  };
}

export const ENV: AppEnv = buildEnv();
