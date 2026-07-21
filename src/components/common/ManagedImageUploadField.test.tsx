import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ManagedImageUploadField } from "@/components/common/ManagedImageUploadField";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";

function renderUploader(overrides: Partial<React.ComponentProps<typeof ManagedImageUploadField>> = {}) {
  const onUpload = vi.fn<(file: File, options: ImageUploadRequestOptions) => Promise<void>>(async () => undefined);
  const onRemove = vi.fn<() => Promise<void>>(async () => undefined);
  const result = render(
    <ManagedImageUploadField
      title="Profile picture"
      description="PNG, JPEG, or WebP up to 2 MB."
      preview={<span>JD</span>}
      previewAlt="Jane Doe profile picture"
      hasImage={false}
      uploadLabel="Add picture"
      replaceLabel="Replace picture"
      onUpload={onUpload}
      onRemove={onRemove}
      {...overrides}
    />,
  );
  const input = result.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { ...result, input, onUpload, onRemove };
}

describe("ManagedImageUploadField", () => {
  beforeEach(() => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })));
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects unsupported files before an upload is attempted", async () => {
    const { input, onUpload } = renderUploader();

    fireEvent.change(input, { target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a PNG, JPEG, or WebP image.");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("reviews a decoded image and passes progress and cancellation controls to the uploader", async () => {
    const { input, onUpload } = renderUploader();
    const file = new File(["image"], "portrait.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    const dialog = await screen.findByRole("dialog", { name: "Review profile picture" });
    expect(dialog).toHaveAccessibleDescription("The center square is used throughout the workspace.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Use picture" }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    const [uploadedFile, options] = onUpload.mock.calls[0];
    expect(uploadedFile).toBe(file);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.onProgress).toEqual(expect.any(Function));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview"));
  });

  it("discards the pending object URL when Escape closes review", async () => {
    const { input, onUpload } = renderUploader();
    fireEvent.change(input, { target: { files: [new File(["image"], "portrait.webp", { type: "image/webp" })] } });
    await screen.findByRole("dialog", { name: "Review profile picture" });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("removes an existing image through the supplied handler", async () => {
    const { onRemove } = renderUploader({ hasImage: true });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  });
});
