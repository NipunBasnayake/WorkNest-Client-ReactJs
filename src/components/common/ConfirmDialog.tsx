import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/common/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTarget =
      dialogRef.current?.querySelector<HTMLElement>("[data-dialog-cancel]") ??
      getFocusableElements(dialogRef.current)[0] ??
      dialogRef.current;

    focusTarget?.focus();

    return () => {
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = getFocusableElements(dialog);

      if (!focusableElements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onCancel();
        }}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={loading || undefined}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-xl"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <h3 id={titleId} className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} data-dialog-cancel>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute("aria-hidden"),
  );
}
