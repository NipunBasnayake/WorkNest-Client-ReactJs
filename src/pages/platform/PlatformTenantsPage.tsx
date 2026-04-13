import { useMemo, useState } from "react";
import { Building2, ChevronRight, ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformTenantsQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState } from "@/components/common/AsyncStates";
import { SkeletonRow } from "@/components/common/AppUI";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "rgba(16,185,129,0.1)", text: "#10b981", dot: "#10b981" },
  inactive: { bg: "rgba(156,163,175,0.1)", text: "#9ca3af", dot: "#9ca3af" },
  suspended: { bg: "rgba(239,68,68,0.1)", text: "#f87171", dot: "#f87171" },
};

export function PlatformTenantsPage() {
  usePageMeta({ title: "Tenants", breadcrumb: ["Platform", "Tenants"] });

  const [search, setSearch] = useState("");
  const { data: tenants = [], error, isLoading, refetch } = usePlatformTenantsQuery(true);

  const errorMessage = useMemo(
    () => (error ? getErrorMessage(error, "Failed to load tenants. Please try again.") : null),
    [error]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tenants.filter((tenant) => (
      !q ||
      tenant.tenantKey?.toLowerCase().includes(q) ||
      tenant.companyName?.toLowerCase().includes(q) ||
      tenant.adminEmail?.toLowerCase().includes(q)
    ));
  }, [search, tenants]);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Registered Tenants
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {isLoading ? "Loading..." : `${tenants.length} tenant workspace${tenants.length !== 1 ? "s" : ""}`}
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
            placeholder="Search tenants..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6">
          <ErrorState message={errorMessage} onRetry={() => void refetch()} />
        </div>
      ) : null}

      <div
        className="overflow-hidden rounded-2xl border"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div
          className="hidden grid-cols-[1.5fr_2fr_2fr_1fr_0.5fr] gap-4 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider sm:grid"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
        >
          <span>Workspace Key</span>
          <span>Company Name</span>
          <span>Admin Email</span>
          <span>Status</span>
          <span />
        </div>

        {isLoading ? Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} cols={5} />) : null}

        {!isLoading && !errorMessage && filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 size={28} />}
            title={search ? "No matching tenants" : "No tenants yet"}
            description={search ? "Try a different search term." : "Registered tenant workspaces will appear here."}
          />
        ) : null}

        {!isLoading && !errorMessage
          ? filtered.map((tenant) => {
              const status = (tenant.status ?? "active").toLowerCase();
              const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
              const initials = (tenant.companyName ?? tenant.tenantKey ?? "?")[0].toUpperCase();

              return (
                <div
                  key={tenant.tenantKey ?? tenant.id}
                  className="group flex flex-col gap-2 border-b px-5 py-4 transition-colors hover:bg-primary-50/30 sm:grid sm:grid-cols-[1.5fr_2fr_2fr_1fr_0.5fr] sm:items-center sm:gap-4 dark:hover:bg-primary-950/10"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
                    >
                      {initials}
                    </div>
                    <span
                      className="truncate font-mono text-sm font-semibold"
                      style={{ color: "var(--color-primary-600)" }}
                    >
                      {tenant.tenantKey ?? "-"}
                    </span>
                  </div>

                  <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {tenant.companyName ?? "-"}
                  </div>

                  <div className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>
                    {tenant.adminEmail ?? "-"}
                  </div>

                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: style.bg, color: style.text }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
                      {status}
                    </span>
                  </div>

                  <div className="hidden justify-end gap-2 sm:flex">
                    <Link
                      to={`/platform/tenants/${tenant.tenantKey}`}
                      className="rounded-lg p-1.5 opacity-0 transition-colors group-hover:opacity-100 hover:bg-primary-50 dark:hover:bg-primary-950/30"
                      style={{ color: "var(--text-tertiary)" }}
                      title="View tenant details"
                    >
                      <ExternalLink size={15} />
                    </Link>
                    <ChevronRight
                      size={16}
                      className="opacity-0 transition-opacity group-hover:opacity-60"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}
