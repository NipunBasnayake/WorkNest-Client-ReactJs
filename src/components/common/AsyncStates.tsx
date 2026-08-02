import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Inbox, LockKeyhole, PackageCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { tenantRoutes } from "@/utils/tenantRoutes";

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 overflow-hidden rounded-lg"
          style={{
            width: `${Math.max(52, 100 - (index % 3) * 14)}%`,
            backgroundColor: "color-mix(in srgb, var(--bg-muted) 88%, var(--bg-surface))",
            animation: "pulse 1.8s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, title = "Something went wrong", onRetry }: ErrorStateProps) {
  if (/Subscription plan does not include this feature/i.test(message)) {
    return (
      <div
        className="overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{
          borderColor: "color-mix(in srgb, var(--brand-action) 22%, var(--border-default))",
          backgroundColor: "color-mix(in srgb, var(--bg-surface) 96%, var(--brand-soft))",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand-action)" }}>
              <LockKeyhole size={14} /> Module locked
            </div>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Upgrade required</h2>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              This module is not included in the workspace subscription package. Compare packages or choose an upgrade to unlock it.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button to={tenantRoutes.settingsPackages()}><PackageCheck size={16} /> Compare plans</Button>
              <Button type="button" variant="secondary" onClick={() => window.history.back()}><ArrowLeft size={16} /> Return</Button>
            </div>
          </div>
          <div className="relative hidden h-44 rounded-2xl border lg:block" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}>
            <div className="absolute left-8 top-8 grid h-20 w-20 place-items-center rounded-2xl" style={{ background: "var(--brand-soft)", color: "var(--brand-action)" }}>
              <LockKeyhole size={34} />
            </div>
            <div className="absolute bottom-7 right-7 h-16 w-28 rounded-xl border" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }} />
            <div className="absolute bottom-11 right-12 h-2 w-16 rounded-full" style={{ background: "var(--brand-action)" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: "color-mix(in srgb, #ef4444 22%, var(--border-default))",
        backgroundColor: "color-mix(in srgb, var(--bg-surface) 98%, #fef2f2)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "color-mix(in srgb, #ef4444 10%, var(--bg-surface))", color: "#ef4444" }}
        >
          <AlertTriangle size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>
            {title}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
          {onRetry ? (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div
      className="rounded-2xl border px-6 py-10 text-center sm:px-8 sm:py-12"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "color-mix(in srgb, var(--bg-surface) 96%, var(--bg-muted))",
      }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-muted) 88%, var(--bg-surface))",
          border: "1px solid var(--border-default)",
          color: "var(--color-primary-500)",
        }}
      >
        {icon ?? <Inbox size={20} />}
      </div>
      <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
