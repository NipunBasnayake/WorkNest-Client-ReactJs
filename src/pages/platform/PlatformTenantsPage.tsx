import { useCallback, useEffect, useState } from "react";
import { Building2, ChevronRight, Search, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getPlatformTenants } from "@/modules/platform/services/platformTenantService";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import type { Tenant } from "@/types";

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: "rgba(16,185,129,0.1)",  text: "#10b981", dot: "#10b981" },
  inactive:  { bg: "rgba(156,163,175,0.1)", text: "#9ca3af", dot: "#9ca3af" },
  suspended: { bg: "rgba(239,68,68,0.1)",   text: "#f87171", dot: "#f87171" },
};

export function PlatformTenantsPage() {
  usePageMeta({ title: "Tenants", breadcrumb: ["Platform", "Tenants"] });

  const [tenants,  setTenants]  = useState<Tenant[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlatformTenants();
      setTenants(data);
    } catch {
      setError("Failed to load tenants. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.tenantKey?.toLowerCase().includes(q) ||
      t.companyName?.toLowerCase().includes(q) ||
      t.adminEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Registered Tenants
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {loading ? "Loading…" : `${tenants.length} tenant workspace${tenants.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search tenants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor:     "var(--border-default)",
              color:           "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchTenants} />
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div
          className="hidden sm:grid grid-cols-[1.5fr_2fr_2fr_1fr_0.5fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
        >
          <span>Workspace Key</span>
          <span>Company Name</span>
          <span>Admin Email</span>
          <span>Status</span>
          <span />
        </div>

        {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<Building2 size={28} />}
            title={search ? "No matching tenants" : "No tenants yet"}
            description={search ? "Try a different search term." : "Registered tenant workspaces will appear here."}
          />
        )}

        {!loading && filtered.map((tenant) => {
          const status  = (tenant.status ?? "active").toLowerCase();
          const style   = STATUS_STYLE[status] ?? STATUS_STYLE.active;
          const initials = (tenant.companyName ?? tenant.tenantKey ?? "?")[0].toUpperCase();

          return (
            <div
              key={tenant.tenantKey ?? tenant.id}
              className="group flex flex-col sm:grid sm:grid-cols-[1.5fr_2fr_2fr_1fr_0.5fr] gap-2 sm:gap-4 sm:items-center px-5 py-4 border-b transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10"
              style={{ borderColor: "var(--border-default)" }}
            >
              {/* Workspace key */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
                >
                  {initials}
                </div>
                <span
                  className="text-sm font-mono font-semibold truncate"
                  style={{ color: "var(--color-primary-600)" }}
                >
                  {tenant.tenantKey ?? "—"}
                </span>
              </div>

              {/* Company name */}
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {tenant.companyName ?? "—"}
              </div>

              {/* Admin email */}
              <div className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                {tenant.adminEmail ?? "—"}
              </div>

              {/* Status badge */}
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: style.bg, color: style.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
                  {status}
                </span>
              </div>

              {/* Link */}
              <div className="hidden sm:flex justify-end gap-2">
                <Link
                  to={`/platform/tenants/${tenant.tenantKey}`}
                  className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-primary-50 dark:hover:bg-primary-950/30"
                  style={{ color: "var(--text-tertiary)" }}
                  title="View tenant details"
                >
                  <ExternalLink size={15} />
                </Link>
                <ChevronRight
                  size={16}
                  className="opacity-0 group-hover:opacity-60 transition-opacity"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
