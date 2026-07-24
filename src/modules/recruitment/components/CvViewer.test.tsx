import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { apiClient } from "@/services/http/client";
import { clearProtectedImageCache } from "@/services/uploads/protectedImageCache";
import { CvViewer } from "@/modules/recruitment/components/CvViewer";

vi.mock("@/services/http/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("CvViewer", () => {
  beforeEach(() => {
    clearProtectedImageCache();
    vi.mocked(apiClient.get).mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:protected-cv"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    clearProtectedImageCache();
    vi.unstubAllGlobals();
  });

  it("loads a protected PDF through the authenticated API client before rendering it", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob(["%PDF-1.7"], { type: "application/pdf" }),
    } as never);

    render(
      <CvViewer
        src="/api/acme/files/80/preview"
        fileName="resume.pdf"
        mimeType="application/pdf"
        applicantName="Ada Lovelace"
      />
    );

    expect(screen.getByText("Loading CV…")).toBeInTheDocument();
    const frame = await screen.findByTitle("Ada Lovelace CV");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/acme/files/80/preview",
      { responseType: "blob" }
    );
    expect(frame).toHaveAttribute(
      "src",
      "blob:protected-cv#page=1&zoom=page-width&toolbar=1&navpanes=0&scrollbar=1"
    );
    await waitFor(() => {
      screen.getAllByRole("link").forEach((link) => {
        expect(link).toHaveAttribute("href", "blob:protected-cv");
      });
    });
  });

  it("shows a specific protected-file failure state", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Unauthorized"));

    render(
      <CvViewer
        src="/api/acme/files/80/preview"
        fileName="resume.pdf"
        mimeType="application/pdf"
        applicantName="Ada Lovelace"
      />
    );

    expect(await screen.findByText("CV could not be loaded")).toBeInTheDocument();
  });
});
