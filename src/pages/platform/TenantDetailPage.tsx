import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, Key, Mail } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformTenantDetailQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { SectionCard } from "@/components/common/SectionCard";
import { formatDate } from "@/utils/formatting";
import { getErrorMessage } from "@/utils/errorHandler";

export function TenantDetailPage() {
  const { tenantKey } = useParams<{ tenantKey: string }>();
  usePageMeta({ title: tenantKey ?? "Tenant Detail", breadcrumb: ["Platform", "Tenants", tenantKey ?? ""] });

  const { data: tenant, error, isLoading, refetch } = usePlatformTenantDetailQuery(tenantKey, true);
  const errorMessage = error ? getErrorMessage(error, "Failed to load tenant details.") : null;

  if (isLoading) {
    return (
      <SectionCard>
        <LoadingSkeleton lines={10} />
      </SectionCard>
    );
  }

  return (
    <div>
      <Link
        to="/platform/tenants"
        className="mb-6 inline-flex items-center gap-2 text-sm no-underline transition-colors hover:text-primary-500"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={16} />
        Back to tenants
      </Link>

      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}

      {!errorMessage && !tenant ? (
        <EmptyState
          title="Tenant not found"
          description="The requested tenant does not exist or is no longer available."
        />
      ) : null}

      {!errorMessage && tenant ? (
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          <div className="mb-8 flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
            >
              {(tenant.companyName ?? tenant.tenantKey ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {tenant.companyName ?? tenant.tenantKey}
              </h1>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {tenant.status ?? "active"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow icon={<Key size={16} />} label="Workspace Key" value={tenant.tenantKey} />
            <FieldRow icon={<Building2 size={16} />} label="Company Name" value={tenant.companyName} />
            <FieldRow icon={<Mail size={16} />} label="Admin Email" value={tenant.adminEmail} />
            <FieldRow icon={<Calendar size={16} />} label="Created" value={formatDate(tenant.createdAt)} />
          </div>

          {Object.keys(tenant).filter((key) => !["id", "tenantKey", "companyName", "adminEmail", "status", "createdAt"].includes(key)).length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-tertiary)" }}>
                Additional Data
              </h3>
              <div
                className="overflow-auto rounded-xl p-4 font-mono text-xs"
                style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
              >
                <pre>{JSON.stringify(
                  Object.fromEntries(
                    Object.entries(tenant).filter(([key]) => !["id", "tenantKey", "companyName", "adminEmail", "status", "createdAt"].includes(key))
                  ),
                  null,
                  2
                )}</pre>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FieldRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border p-4"
      style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: "var(--color-primary-500)" }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </div>
        <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {value ?? "-"}
        </div>
      </div>
    </div>
  );
}
