import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "dense" | "table" | "plain";
}

const sectionClasses = {
  default: "rounded-2xl border",
  dense: "rounded-2xl border",
  table: "overflow-hidden rounded-2xl border",
  plain: "rounded-2xl border",
};

const headerClasses = {
  default: "flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6",
  dense: "flex flex-col gap-2.5 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
  table: "flex flex-col gap-2.5 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6",
  plain: "flex flex-col gap-3 border-b px-0 pb-4 sm:flex-row sm:items-center sm:justify-between",
};

const contentClasses = {
  default: "p-5 sm:p-6",
  dense: "p-4",
  table: "p-0",
  plain: "pt-3",
};

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
  contentClassName = "",
  variant = "default",
}: SectionCardProps) {
  const isPlain = variant === "plain";

  return (
    <section
      className={`${sectionClasses[variant]} ${className}`}
      style={{
        backgroundColor: isPlain ? "transparent" : variant === "table" ? "var(--bg-surface)" : "color-mix(in srgb, var(--bg-surface) 98%, var(--bg-muted))",
        borderColor: isPlain ? "transparent" : variant === "table" ? "var(--border-strong)" : "var(--border-default)",
        boxShadow: isPlain ? "none" : variant === "table" ? "var(--shadow-sm)" : "var(--shadow-sm)",
      }}
    >
      {(title || subtitle || action) && (
        <div
          className={headerClasses[variant]}
          style={{ borderColor: isPlain ? "transparent" : variant === "table" ? "var(--border-strong)" : "var(--border-default)" }}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg" style={{ color: "var(--text-primary)" }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={`${contentClasses[variant]} ${contentClassName}`}>{children}</div>
    </section>
  );
}
