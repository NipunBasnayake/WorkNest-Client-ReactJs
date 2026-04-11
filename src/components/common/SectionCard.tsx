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
      className={`rounded-3xl border ${className}`}
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {(title || subtitle || action) && (
        <div
          className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6"
          style={{ borderColor: "var(--border-default)" }}
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

      <div className={`p-5 sm:p-6 ${contentClassName}`}>{children}</div>
    </section>
  );
}
