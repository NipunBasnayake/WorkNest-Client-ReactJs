import { useToastStore, type ToastKind } from "@/store/toastStore";

interface ToastPayload {
  title: string;
  description?: string;
  durationMs?: number;
}

function push(kind: ToastKind, payload: ToastPayload): string {
  return useToastStore.getState().push({
    kind,
    title: payload.title,
    description: payload.description,
    durationMs: payload.durationMs ?? 3200,
  });
}

export function useToast() {
  return {
    success: (payload: ToastPayload) => push("success", payload),
    error: (payload: ToastPayload) => push("error", payload),
    info: (payload: ToastPayload) => push("info", payload),
    dismiss: (id: string) => useToastStore.getState().remove(id),
    clear: () => useToastStore.getState().clear(),
  };
}
