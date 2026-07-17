import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { isAnonymousRecruitmentPath, publicClient, tokenStorage } from "@/services/http/client";

describe("public recruitment HTTP isolation", () => {
  afterEach(() => {
    tokenStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("does not attach session or tenant headers to anonymous careers requests", async () => {
    tokenStorage.setTokens("expired-access-token", "expired-refresh-token");
    tokenStorage.setCsrf("stored-csrf-token");
    tokenStorage.setContext("another-tenant", "tenant");
    window.history.replaceState({}, "", "/public-tenant/careers");

    let captured: InternalAxiosRequestConfig | undefined;
    await publicClient.get("/api/public/public-tenant/careers", {
      adapter: async (config) => {
        captured = config;
        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(captured).toBeDefined();
    expect(captured?.withCredentials).toBe(false);
    expect(captured?.headers.get("Authorization")).toBeUndefined();
    expect(captured?.headers.get("X-CSRF-TOKEN")).toBeUndefined();
    expect(captured?.headers.get("X-Device-Id")).toBeUndefined();
    expect(captured?.headers.get("X-Tenant-Slug")).toBeUndefined();
    expect(captured?.headers.get("X-Tenant-ID")).toBeUndefined();
    expect(captured?.headers.get("Content-Type")).toBeUndefined();
  });

  it("keeps FormData intact and does not force a JSON content type", async () => {
    const formData = new FormData();
    formData.append("application", new Blob(["{}"], { type: "application/json" }));
    formData.append("resume", new File(["%PDF-test"], "resume.pdf", { type: "application/pdf" }));

    let captured: InternalAxiosRequestConfig | undefined;
    await publicClient.post("/api/public/acme/careers/engineer/apply", formData, {
      adapter: async (config) => {
        captured = config;
        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(captured?.data).toBe(formData);
    expect(captured?.headers.get("Content-Type")).not.toBe("application/json");
    expect(captured?.withCredentials).toBe(false);
  });

  it("still lets Axios serialize ordinary object bodies as JSON", async () => {
    let captured: InternalAxiosRequestConfig | undefined;
    await publicClient.post("/api/auth/refresh", { refreshToken: "token" }, {
      adapter: async (config) => {
        captured = config;
        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(captured?.data).toBe('{"refreshToken":"token"}');
    expect(captured?.headers.get("Content-Type")).toBe("application/json");
  });

  it("recognizes only the explicitly anonymous recruitment routes", () => {
    expect(isAnonymousRecruitmentPath("/acme/careers")).toBe(true);
    expect(isAnonymousRecruitmentPath("/acme/careers/frontend-engineer")).toBe(true);
    expect(isAnonymousRecruitmentPath("/acme/careers/frontend-engineer/apply")).toBe(true);
    expect(isAnonymousRecruitmentPath("/acme/applications/APP-123/success")).toBe(true);
    expect(isAnonymousRecruitmentPath("/acme/recruitment/jobs")).toBe(false);
    expect(isAnonymousRecruitmentPath("/acme/employees")).toBe(false);
  });
});
