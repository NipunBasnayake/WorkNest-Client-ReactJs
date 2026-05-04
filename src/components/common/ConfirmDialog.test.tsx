import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  return render(
    <ConfirmDialog
      open
      title="Delete item"
      description="This action cannot be undone."
      confirmLabel="Delete"
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ConfirmDialog", () => {
  it("exposes dialog semantics and initially focuses the cancel action", async () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Delete item" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("This action cannot be undone.");

    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
  });

  it("closes with Escape when not loading", () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("traps keyboard focus inside the dialog", async () => {
    renderDialog();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: "Delete" });

    await waitFor(() => expect(cancelButton).toHaveFocus());

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(confirmButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(cancelButton).toHaveFocus();
  });

  it("restores focus to the previously focused element when closed", async () => {
    const opener = document.createElement("button");
    opener.textContent = "Open dialog";
    document.body.appendChild(opener);
    opener.focus();

    const { rerender } = renderDialog();

    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());

    rerender(
      <ConfirmDialog
        open={false}
        title="Delete item"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("does not close from Escape or backdrop clicks while loading", () => {
    const onCancel = vi.fn();
    renderDialog({ loading: true, onCancel });

    const dialog = screen.getByRole("dialog", { name: "Delete item" });
    const backdrop = dialog.previousElementSibling;

    expect(dialog).toHaveAttribute("aria-busy", "true");

    fireEvent.keyDown(document, { key: "Escape" });
    if (backdrop) fireEvent.click(backdrop);

    expect(onCancel).not.toHaveBeenCalled();
  });
});
