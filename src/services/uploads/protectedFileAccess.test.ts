import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/http/client";
import { openProtectedFile } from "@/services/uploads/fileUploadService";

vi.mock("@/services/http/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("protected file access", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:protected-download"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("downloads protected files through the authenticated API client", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob(["resume"], { type: "application/pdf" }),
    } as never);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    await openProtectedFile("/api/acme/files/80/download", "resume.pdf", true);

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/acme/files/80/download",
      { responseType: "blob" }
    );
    expect(click).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });
});
