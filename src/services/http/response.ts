import type { ApiResponse } from "@/types";

type MaybeWrapped<T> = ApiResponse<T> | T;

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
