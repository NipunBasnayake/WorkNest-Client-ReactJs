import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/* ── Stat Card ── */
interface StatCardProps {
  label:       string;
  value:       string | number;
  icon:        ReactNode;
  trend?:      { value: number; label: string };
  accentColor?: string;
}

export function StatCard({ label, value, icon, trend, accentColor = "var(--brand-action)" }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 border flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        backgroundColor: "color-mix(in srgb, var(--bg-surface) 98%, var(--bg-muted))",
        borderColor:     "var(--border-default)",
        boxShadow:       "var(--shadow-sm)",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `color-mix(in srgb, ${accentColor}12, var(--bg-muted))`,
          border:     `1px solid ${accentColor}20`,
        }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {value}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {label}
        </div>
        {trend && (
          <div
            className={`text-xs mt-1 font-medium ${trend.value >= 0 ? "text-emerald-500" : "text-red-400"}`}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page Section ── */
export function PageSection({
  title,
  description,
  children,
  action,
}: {
  title:        string;
  description?: string;
  children:     ReactNode;
  action?:      ReactNode;
}) {
  return (
    <div className="mb-8">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Empty State ── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?:        ReactNode;
  title:        string;
  description?: string;
  action?:      ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: "color-mix(in srgb, var(--bg-muted) 88%, var(--bg-surface))",
            border:     "1px solid var(--border-default)",
            color:      "var(--color-primary-500)",
          }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Loading Skeleton ── */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 border-b px-4 py-3 animate-pulse" style={{ borderColor: "var(--border-default)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded flex-1"
          style={{ backgroundColor: "color-mix(in srgb, var(--bg-muted) 88%, var(--bg-surface))" }}
        />
      ))}
    </div>
  );
}

/* ── Error Banner ── */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border p-4"
      style={{
        backgroundColor: "color-mix(in srgb, var(--bg-surface) 98%, #fef2f2)",
        borderColor:     "color-mix(in srgb, #ef4444 22%, var(--border-default))",
      }}
    >
      <div className="text-red-400 shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "#dc2626" }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 cursor-pointer text-xs font-medium text-red-500 transition-colors hover:text-red-400"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ── Quick Nav Card ── */
export function QuickNavCard({
  label,
  description,
  icon,
  to,
  disabled,
  disabledHint = "Coming Soon",
}: {
  label:       string;
  description: string;
  icon:        ReactNode;
  to:          string;
  disabled?:   boolean;
  disabledHint?: string;
}) {
  if (disabled) {
    return (
      <div
        className="flex cursor-not-allowed items-start gap-3 rounded-2xl border p-5 opacity-60"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--bg-muted) 88%, var(--bg-surface))", border: "1px solid var(--border-default)", color: "var(--color-primary-500)" }}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</div>
          <span className="mt-1 inline-block text-[10px] font-semibold" style={{ color: "var(--text-tertiary)" }}>{disabledHint}</span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border p-5 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        backgroundColor: "color-mix(in srgb, var(--bg-surface) 99%, var(--bg-muted))",
        borderColor:     "var(--border-default)",
        boxShadow:       "var(--shadow-sm)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-[1.03]"
        style={{
          background: "color-mix(in srgb, var(--bg-muted) 88%, var(--bg-surface))",
          border:     "1px solid var(--border-default)",
          color:      "var(--color-primary-500)",
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400" style={{ color: "var(--text-primary)" }}>
          {label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</div>
      </div>
    </Link>
  );
}
