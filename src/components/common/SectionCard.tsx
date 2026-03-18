import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({ title, subtitle, action, children, className = "", contentClassName = "" }: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border ${className}`}
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      {(title || subtitle || action) && (
        <div
          className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={`p-4 sm:p-5 ${contentClassName}`}>{children}</div>
    </section>
  );
}
