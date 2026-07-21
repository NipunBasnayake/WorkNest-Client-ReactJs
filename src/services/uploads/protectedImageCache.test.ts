import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/http/client";
import {
  acquireProtectedImage,
  clearProtectedImageCache,
  releaseProtectedImage,
} from "@/services/uploads/protectedImageCache";

vi.mock("@/services/http/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("protected image cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearProtectedImageCache();
    vi.mocked(apiClient.get).mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:avatar"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    clearProtectedImageCache();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("deduplicates downloads and revokes the blob after the final release", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(["avatar"]) } as never);
    const source = "/api/acme/files/7/variants/128/preview";

    const [first, second] = await Promise.all([
      acquireProtectedImage(source),
      acquireProtectedImage(source),
    ]);

    expect(first).toBe("blob:avatar");
    expect(second).toBe("blob:avatar");
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    releaseProtectedImage(source);
    releaseProtectedImage(source);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:avatar");
  });

  it("clears protected blobs immediately when the authenticated tenant changes", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(["avatar"]) } as never);
    await acquireProtectedImage("/api/acme/files/7/preview");

    clearProtectedImageCache();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:avatar");
  });
});
