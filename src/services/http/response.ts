import type { ApiResponse } from "@/types";

type MaybeWrapped<T> = ApiResponse<T> | T;

export interface ApiEnvelope<T> {
  data: T;
  success?: boolean;
  message?: string;
  errorCode?: string;
}

export function unwrapApiData<T>(payload: MaybeWrapped<T>): T {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload
  ) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

export function readApiEnvelope<T>(payload: MaybeWrapped<T>): ApiEnvelope<T> {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload
  ) {
    const wrapped = payload as ApiResponse<T>;
    return {
      data: wrapped.data,
      success: wrapped.success,
      message: wrapped.message,
      errorCode: wrapped.errorCode,
    };
  }

  return { data: payload as T };
}
