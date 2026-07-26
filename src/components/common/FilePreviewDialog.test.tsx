import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilePreviewDialog } from "@/components/common/FilePreviewDialog";
import { apiClient } from "@/services/http/client";

vi.mock("@/services/http/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
  buildTenantApiUrl: (path: string) => `/api/acme${path}`,
}));

describe("FilePreviewDialog", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders an image and revokes its object URL on close", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob(["image"], { type: "image/png" }),
    } as never);
    const onClose = vi.fn();
    const view = render(
      <FilePreviewDialog
        file={{ id: "8", name: "diagram.png", url: "/api/acme/files/8/preview", mimeType: "image/png" }}
        onClose={onClose}
      />,
    );

    expect(await screen.findByRole("img", { name: "diagram.png" })).toHaveAttribute("src", "blob:preview");
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("shows permission feedback and retries a failed preview", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 403 } })
      .mockResolvedValueOnce({ data: new Blob(["pdf"], { type: "application/pdf" }) } as never);

    render(
      <FilePreviewDialog
        file={{ id: "9", name: "policy.pdf", url: "/api/acme/files/9/preview", mimeType: "application/pdf" }}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText("You do not have permission to access this file.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByTitle("policy.pdf")).toBeInTheDocument();
  });
});
