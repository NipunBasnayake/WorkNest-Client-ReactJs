export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

export function getString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function getNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function getBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
}

export function getId(value: unknown): string {
  return getString(value) ?? "";
}

export function firstDefined<T>(...values: Array<T | undefined>): T | undefined {
  return values.find((value) => value !== undefined);
}

export function extractList<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!isRecord(payload)) return [];

  const listKeys = [
    "content",
    "items",
    "records",
    "results",
    "list",
    "employees",
    "projects",
    "tasks",
    "teams",
    "announcements",
    "notifications",
    "messages",
    "conversations",
    "data",
  ];

  for (const key of listKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value as T[];
  }

  const page = payload.page;
  if (isRecord(page) && Array.isArray(page.content)) {
    return page.content as T[];
  }

  return [];
}

export function toIsoDate(value: unknown): string {
  const text = getString(value);
  if (!text) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString().slice(0, 10);
}

export function toIsoDateTime(value: unknown): string {
  const text = getString(value);
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString();
}
