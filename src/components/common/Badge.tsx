import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  showDot?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { background: string; color: string; border: string }> = {
  default: { background: "rgba(147,50,234,0.10)", color: "var(--color-primary-700)", border: "rgba(147,50,234,0.20)" },
  secondary: { background: "var(--bg-muted)", color: "var(--text-secondary)", border: "var(--border-default)" },
  success: { background: "rgba(16,185,129,0.10)", color: "#059669", border: "rgba(16,185,129,0.20)" },
  warning: { background: "rgba(245,158,11,0.10)", color: "#d97706", border: "rgba(245,158,11,0.22)" },
  danger: { background: "rgba(239,68,68,0.10)", color: "#dc2626", border: "rgba(239,68,68,0.20)" },
  info: { background: "rgba(59,130,246,0.10)", color: "#2563eb", border: "rgba(59,130,246,0.20)" },
  neutral: { background: "rgba(100,116,139,0.10)", color: "#475569", border: "rgba(100,116,139,0.20)" },
};

export function Badge({ children, variant = "default", showDot = false, className = "" }: BadgeProps) {
  const style = VARIANT_STYLES[variant];

  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none", showDot && "gap-1.5", className)}
      style={{ backgroundColor: style.background, color: style.color, borderColor: style.border }}
    >
      {showDot ? <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.color }} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}