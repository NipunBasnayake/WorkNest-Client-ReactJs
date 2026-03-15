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

export function StatCard({ label, value, icon, trend, accentColor = "#9332EA" }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 border flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor:     "var(--border-default)",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}10 100%)`,
          border:     `1px solid ${accentColor}30`,
        }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background:  "rgba(147,50,234,0.08)",
            border:      "1px solid rgba(147,50,234,0.15)",
            color:       "var(--color-primary-500)",
          }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-xs"  style={{ color: "var(--text-secondary)" }}>
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
    <div className="flex gap-4 px-4 py-3 border-b animate-pulse" style={{ borderColor: "var(--border-default)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded flex-1"
          style={{ backgroundColor: "var(--bg-muted)" }}
        />
      ))}
    </div>
  );
}

/* ── Error Banner ── */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3 border"
      style={{
        backgroundColor: "rgba(239,68,68,0.06)",
        borderColor:     "rgba(239,68,68,0.2)",
      }}
    >
      <div className="text-red-400 shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-400 font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer shrink-0"
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
}: {
  label:       string;
  description: string;
  icon:        ReactNode;
  to:          string;
  disabled?:   boolean;
}) {
  if (disabled) {
    return (
      <div
        className="rounded-2xl p-5 border flex items-start gap-3 opacity-50 cursor-not-allowed"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(147,50,234,0.08)", border: "1px solid rgba(147,50,234,0.15)", color: "var(--color-primary-500)" }}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</div>
          <span className="text-[10px] font-semibold text-primary-400 mt-1 inline-block">Coming Soon</span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="rounded-2xl p-5 border flex items-start gap-3 group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 no-underline"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor:     "var(--border-default)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
        style={{
          background: "linear-gradient(135deg, rgba(147,50,234,0.14) 0%, rgba(168,85,247,0.08) 100%)",
          border:     "1px solid rgba(147,50,234,0.2)",
          color:      "var(--color-primary-500)",
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" style={{ color: "var(--text-primary)" }}>
          {label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</div>
      </div>
    </Link>
  );
}
