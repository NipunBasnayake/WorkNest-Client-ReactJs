import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  primaryActions?: ReactNode;
  secondaryActions?: ReactNode;
  breadcrumb?: ReactNode;
  status?: ReactNode;
  backButton?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  primaryActions,
  secondaryActions,
  breadcrumb,
  status,
  backButton,
  actions,
  className = "",
}: PageHeaderProps) {
  const resolvedPrimaryActions = primaryActions ?? actions;

  return (
    <header className={cn("space-y-4", className)}>
      {(backButton || breadcrumb) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {backButton}
          {breadcrumb}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="truncate text-2xl font-semibold tracking-tight sm:text-[2rem]"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>

              {status && (
                <div className="flex-shrink-0">
                  {status}
                </div>
              )}
            </div>

            {description && (
              <p
                className="max-w-3xl text-sm leading-6 sm:text-[15px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {(secondaryActions || resolvedPrimaryActions) && (
          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            {secondaryActions}
            {resolvedPrimaryActions}
          </div>
        )}
      </div>
    </header>
  );
}