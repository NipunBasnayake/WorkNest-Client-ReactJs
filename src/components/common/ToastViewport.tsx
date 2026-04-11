import { useEffect, type ReactNode } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, type ToastItem } from "@/store/toastStore";

const STYLE_BY_KIND: Record<ToastItem["kind"], { icon: ReactNode; border: string; background: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 size={16} />,
    border: "rgba(16,185,129,0.35)",
    background: "rgba(16,185,129,0.1)",
    iconColor: "#10b981",
  },
  error: {
    icon: <XCircle size={16} />,
    border: "rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.1)",
    iconColor: "#ef4444",
  },
  info: {
    icon: <Info size={16} />,
    border: "rgba(14,165,233,0.35)",
    background: "rgba(14,165,233,0.1)",
    iconColor: "#0ea5e9",
  },
};

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const remove = useToastStore((state) => state.remove);

  useEffect(() => {
    const timers = items.map((item) => {
      const timer = window.setTimeout(() => {
        remove(item.id);
      }, item.durationMs);
      return timer;
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [items, remove]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[110] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => {
        const style = STYLE_BY_KIND[item.kind];
        return (
          <div
            key={item.id}
            className="pointer-events-auto rounded-xl border p-3 shadow-lg backdrop-blur-sm"
            style={{
              borderColor: style.border,
              backgroundColor: style.background,
            }}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0" style={{ color: style.iconColor }}>
                {style.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-md p-1 transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
