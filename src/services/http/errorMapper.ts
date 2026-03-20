import axios from "axios";
import { asRecord, firstDefined, getString } from "@/services/http/parsers";

export type ApiErrorKind =
  | "offline"
  | "unreachable"
  | "timeout"
  | "server"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "client"
  | "unknown";

export interface ApiErrorInfo {
  kind: ApiErrorKind;
  userMessage: string;
  canRetry: boolean;
  status?: number;
}

type ErrorWithApiInfo = Error & { apiErrorInfo?: ApiErrorInfo };

const OFFLINE_MESSAGE = "Your internet connection appears to be lost. Please check your connection.";
const UNREACHABLE_MESSAGE = "Unable to reach the server right now. Please try again.";
const TIMEOUT_MESSAGE = "The request took too long. Please retry.";
const SERVER_MESSAGE = "Something went wrong. Please try again.";
const DEFAULT_MESSAGE = SERVER_MESSAGE;

function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function readBackendMessage(payload: unknown): string | null {
  const value = asRecord(payload);

  const topLevel = firstDefined(
    getString(value.message),
    getString(value.error),
    getString(value.detail),
    getString(value.title)
  );
  if (topLevel) return topLevel;

  const nestedData = asRecord(value.data);
  const dataMessage = firstDefined(
    getString(nestedData.message),
    getString(nestedData.error),
    getString(nestedData.detail)
  );
  if (dataMessage) return dataMessage;

  const nestedError = asRecord(value.error);
  return firstDefined(
    getString(nestedError.message),
    getString(nestedError.detail)
  ) ?? null;
}

function fromHttpStatus(status: number, backendMessage: string | null): ApiErrorInfo {
  if (status >= 500) {
    return { kind: "server", userMessage: SERVER_MESSAGE, canRetry: true, status };
  }

  if (status === 401) {
    return {
      kind: "unauthorized",
      userMessage: backendMessage ?? "Your session is no longer valid. Please sign in again.",
      canRetry: false,
      status,
    };
  }

  if (status === 403) {
    return {
      kind: "forbidden",
      userMessage: backendMessage ?? "You do not have permission to perform this action.",
      canRetry: false,
      status,
    };
  }

  if (status === 404) {
    return {
      kind: "not_found",
      userMessage: backendMessage ?? "The requested resource could not be found.",
      canRetry: false,
      status,
    };
  }

  if (status === 422) {
    return {
      kind: "validation",
      userMessage: backendMessage ?? "Please review the provided values and try again.",
      canRetry: false,
      status,
    };
  }

  if (status >= 400) {
    return {
      kind: "client",
      userMessage: backendMessage ?? DEFAULT_MESSAGE,
      canRetry: false,
      status,
    };
  }

  return { kind: "unknown", userMessage: backendMessage ?? DEFAULT_MESSAGE, canRetry: false, status };
}

export function mapApiError(error: unknown, fallbackMessage = DEFAULT_MESSAGE): ApiErrorInfo {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message.trim()) {
      return { kind: "unknown", userMessage: error.message, canRetry: false };
    }

    return { kind: "unknown", userMessage: fallbackMessage, canRetry: false };
  }

  if (!isBrowserOnline()) {
    return { kind: "offline", userMessage: OFFLINE_MESSAGE, canRetry: true };
  }

  const timeout = error.code === "ECONNABORTED" || /timeout/i.test(error.message);
  if (timeout) {
    return { kind: "timeout", userMessage: TIMEOUT_MESSAGE, canRetry: true };
  }

  if (!error.response) {
    return { kind: "unreachable", userMessage: UNREACHABLE_MESSAGE, canRetry: true };
  }

  const backendMessage = readBackendMessage(error.response.data);
  return fromHttpStatus(error.response.status, backendMessage);
}

export function attachApiErrorInfo(error: unknown, fallbackMessage = DEFAULT_MESSAGE): ApiErrorInfo {
  const info = mapApiError(error, fallbackMessage);
  if (error && typeof error === "object") {
    (error as ErrorWithApiInfo).apiErrorInfo = info;
  }
  return info;
}

export function readApiErrorInfo(error: unknown): ApiErrorInfo | null {
  if (!error || typeof error !== "object") return null;
  const value = error as ErrorWithApiInfo;
  return value.apiErrorInfo ?? null;
}

export function extractApiErrorMessage(error: unknown, fallbackMessage = DEFAULT_MESSAGE): string {
  const known = readApiErrorInfo(error);
  if (known?.userMessage) return known.userMessage;
  return mapApiError(error, fallbackMessage).userMessage;
}

export function isNetworkFailure(kind: ApiErrorKind): boolean {
  return kind === "offline" || kind === "unreachable" || kind === "timeout" || kind === "server";
}
