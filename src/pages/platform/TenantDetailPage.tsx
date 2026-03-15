import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, ArrowLeft, Mail, Calendar, Key } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getTenantByKeyApi } from "@/services/api/platformApi";
import { ErrorBanner } from "@/components/common/AppUI";
import type { Tenant } from "@/types";

export function TenantDetailPage() {
  const { tenantKey } = useParams<{ tenantKey: string }>();
  usePageMeta({ title: tenantKey ?? "Tenant Detail", breadcrumb: ["Platform", "Tenants", tenantKey ?? ""] });

  const [tenant,  setTenant]  = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!tenantKey) return;
    setLoading(true);
    getTenantByKeyApi(tenantKey)
      .then(setTenant)
      .catch(() => setError("Failed to load tenant details."))
      .finally(() => setLoading(false));
  }, [tenantKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
        />
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/platform/tenants"
        className="inline-flex items-center gap-2 text-sm mb-6 no-underline transition-colors hover:text-primary-500"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={16} />
        Back to tenants
      </Link>

      {error && <ErrorBanner message={error} />}

      {!error && tenant && (
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          <div className="flex items-start gap-4 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
            >
              {(tenant.companyName ?? tenant.tenantKey ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {tenant.companyName ?? tenant.tenantKey}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {tenant.status ?? "active"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FieldRow icon={<Key size={16} />}      label="Workspace Key"  value={tenant.tenantKey} />
            <FieldRow icon={<Building2 size={16} />} label="Company Name"  value={tenant.companyName} />
            <FieldRow icon={<Mail size={16} />}      label="Admin Email"   value={tenant.adminEmail} />
            <FieldRow icon={<Calendar size={16} />}  label="Created"       value={tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : undefined} />
          </div>

          {/* Raw data from API if extra fields */}
          {Object.keys(tenant).filter((k) => !["id","tenantKey","companyName","adminEmail","status","createdAt"].includes(k)).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-tertiary)" }}>Additional Data</h3>
              <div className="rounded-xl p-4 font-mono text-xs overflow-auto" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}>
                <pre>{JSON.stringify(
                  Object.fromEntries(
                    Object.entries(tenant).filter(([k]) => !["id","tenantKey","companyName","adminEmail","status","createdAt"].includes(k))
                  ),
                  null, 2
                )}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl border"
      style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: "var(--color-primary-500)" }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </div>
        <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
}
