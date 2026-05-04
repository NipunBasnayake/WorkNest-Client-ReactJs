import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/common/Button";

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
