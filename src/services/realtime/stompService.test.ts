import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveBackendHealthUrl, resolveWebSocketUrl } from "@/services/realtime/stompService";

describe("native realtime WebSocket URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses an explicitly configured native WebSocket URL", () => {
    vi.stubEnv("VITE_WS_URL", "wss://realtime.example.test/worknest");

    expect(resolveWebSocketUrl()).toBe("wss://realtime.example.test/worknest");
  });

  it("converts an HTTP websocket setting for backwards-compatible deployments", () => {
    vi.stubEnv("VITE_WS_URL", "https://realtime.example.test/ws");

    expect(resolveWebSocketUrl()).toBe("wss://realtime.example.test/ws");
  });

  it("derives a secure native endpoint from the API base URL", () => {
    vi.stubEnv("VITE_WS_URL", "");
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/base/");

    expect(resolveWebSocketUrl()).toBe("wss://api.example.test/base/ws");
  });

  it("derives the backend readiness endpoint from the API base URL", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/base/");

    expect(resolveBackendHealthUrl()).toBe("https://api.example.test/base/actuator/health");
  });

  it("rejects protocols that cannot carry a WebSocket connection", () => {
    vi.stubEnv("VITE_WS_URL", "ftp://realtime.example.test/ws");

    expect(() => resolveWebSocketUrl()).toThrow(
      "VITE_WS_URL must use http, https, ws, or wss"
    );
  });
});
