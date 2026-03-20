import { create } from "zustand";
import type { ApiErrorInfo } from "@/services/http/errorMapper";

export type NetworkIssueKind = "offline" | "unreachable" | "timeout" | "server";

export interface NetworkIssue {
  kind: NetworkIssueKind;
  message: string;
  occurredAt: number;
}

interface NetworkState {
  isBrowserOnline: boolean;
  issue: NetworkIssue | null;
  setBrowserOnline: (isOnline: boolean) => void;
  reportApiIssue: (error: ApiErrorInfo) => void;
  markApiHealthy: () => void;
  clearIssue: () => void;
}

function resolveInitialOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function toIssue(error: ApiErrorInfo): NetworkIssue | null {
  if (error.kind !== "offline" && error.kind !== "unreachable" && error.kind !== "timeout" && error.kind !== "server") {
    return null;
  }

  return {
    kind: error.kind,
    message: error.userMessage,
    occurredAt: Date.now(),
  };
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isBrowserOnline: resolveInitialOnline(),
  issue: null,

  setBrowserOnline: (isOnline) => {
    if (!isOnline) {
      set({
        isBrowserOnline: false,
        issue: {
          kind: "offline",
          message: "Your internet connection appears to be lost. Please check your connection.",
          occurredAt: Date.now(),
        },
      });
      return;
    }

    const currentIssue = get().issue;
    set({
      isBrowserOnline: true,
      issue: currentIssue?.kind === "offline" ? null : currentIssue,
    });
  },

  reportApiIssue: (error) => {
    const issue = toIssue(error);
    if (!issue) return;
    set({
      issue,
      isBrowserOnline: issue.kind === "offline" ? false : get().isBrowserOnline,
    });
  },

  markApiHealthy: () => {
    const { isBrowserOnline, issue } = get();
    if (!isBrowserOnline) return;
    if (!issue) return;
    if (issue.kind === "offline") return;
    set({ issue: null });
  },

  clearIssue: () => set({ issue: null }),
}));
