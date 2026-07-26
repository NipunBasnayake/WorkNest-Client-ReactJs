import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface SubscriptionDialogShellProps {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  busy?: boolean;
  size?: "md" | "lg";
}

export function SubscriptionDialogShell({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  busy = false,
  size = "md",
}: SubscriptionDialogShellProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
        aria-label="Close dialog"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy || undefined}
        tabIndex={-1}
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border shadow-xl ${
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        }`}
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6" style={{ borderColor: "var(--border-default)" }}>
          <div>
            <h2 id={titleId} className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
            <p id={descriptionId} className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
        <div className="flex flex-wrap justify-end gap-2 border-t p-5 sm:p-6" style={{ borderColor: "var(--border-default)" }}>
          {footer}
        </div>
      </div>
    </div>
  );
}
