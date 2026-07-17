import { useMemo, useState } from "react";
import { Building2, CircleAlert, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformTenantsQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState } from "@/components/common/AsyncStates";
import { SkeletonRow } from "@/components/common/AppUI";
import { SearchField } from "@/components/common/SearchField";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatRelativeTime } from "@/utils/formatting";
import { PlatformStatusBadge } from "@/modules/platform/components/PlatformStatusBadge";
import { platformStatusLabel } from "@/modules/platform/status";
import { TenantActionsMenu } from "@/modules/platform/components/TenantActionsMenu";
import { Pagination } from "@/components/common/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";

export function PlatformTenantsPage() {
  usePageMeta({ title: "Tenant Management", breadcrumb: ["Platform", "Tenants"] });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data: tenants = [], error, isLoading, refetch } = usePlatformTenantsQuery(true);
  const errorMessage = useMemo(() => error ? getErrorMessage(error, "Failed to load tenants. Please try again.") : null, [error]);

  const statusCounts = useMemo(() => tenants.reduce<Record<string, number>>((counts, tenant) => {
    const status = String(tenant.status ?? "INACTIVE").toUpperCase();
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {}), [tenants]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const status = String(tenant.status ?? "INACTIVE").toUpperCase();
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesSearch = !query || [tenant.tenantKey, tenant.companyName, tenant.adminEmail, tenant.adminName, tenant.databaseName]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tenants]);
  const tenantPagination = useClientPagination(filtered, {
    storageKey: "platform-tenants",
    resetKey: `${search}|${statusFilter}`,
  });

  const attentionCount = (statusCounts.SUSPENDED ?? 0) + (statusCounts.INACTIVE ?? 0) + (statusCounts.PROVISIONING ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Tenant Management" description="Manage company lifecycle, administrator access, onboarding, and workspace health." />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={<Building2 size={19} />} label="Registered companies" value={tenants.length} color="#9332ea" />
        <SummaryCard icon={<ShieldCheck size={19} />} label="Active companies" value={statusCounts.ACTIVE ?? 0} color="#059669" />
        <SummaryCard icon={<CircleAlert size={19} />} label="Need attention" value={attentionCount} color="#d97706" />
      </div>

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2" aria-label="Filter tenants by status">
          {["ALL", "ACTIVE", "PROVISIONING", "SUSPENDED", "INACTIVE", "ARCHIVED", "REJECTED"].map((status) => (
            <button key={status} type="button" onClick={() => setStatusFilter(status)} className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors" style={{ borderColor: statusFilter === status ? "var(--color-primary-500)" : "var(--border-default)", background: statusFilter === status ? "rgba(147,50,234,.1)" : "var(--bg-surface)", color: statusFilter === status ? "var(--color-primary-600)" : "var(--text-secondary)" }}>
              {status === "ALL" ? "All" : platformStatusLabel(status)} {status === "ALL" ? tenants.length : statusCounts[status] ?? 0}
            </button>
          ))}
        </div>
        <SearchField label="Search tenants" placeholder="Company, key, admin, database..." value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} className="w-full lg:w-80" />
      </div>

      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}

      <SectionCard variant="table">
        <div className="overflow-x-auto">
          <table className="worknest-data-table w-full min-w-[1080px] text-left">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)", background: "var(--bg-muted)" }}>
                <th className="px-5 py-3">Company</th>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Workspace usage</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={6}>{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={6} />)}</td></tr> : null}
              {!isLoading && !errorMessage ? tenantPagination.paginatedItems.map((tenant) => (
                <tr key={tenant.tenantKey ?? tenant.id} className="border-b transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10" style={{ borderColor: "var(--border-default)" }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-sm font-bold text-purple-600">{(tenant.companyName ?? tenant.tenantKey ?? "?")[0].toUpperCase()}</span>
                      <div className="min-w-0">
                        <Link to={`/platform/tenants/${tenant.tenantKey}`} className="block max-w-56 truncate text-sm font-semibold text-purple-600 hover:underline">{tenant.companyName}</Link>
                        <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{tenant.tenantKey}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-52 truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{tenant.adminName ?? "Not assigned"}</p>
                    <p className="mt-0.5 max-w-52 truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{tenant.adminEmail ?? "No admin email"}</p>
                  </td>
                  <td className="px-4 py-4">
                    {tenant.usageAvailable ? (
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{tenant.employeeCount ?? 0} users · {tenant.projectCount ?? 0} projects · {tenant.taskCount ?? 0} tasks</p>
                    ) : <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Usage unavailable</p>}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{formatRelativeTime(tenant.lastActivityAt)}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>Admin login {formatRelativeTime(tenant.lastLoginAt)}</p>
                  </td>
                  <td className="px-4 py-4"><PlatformStatusBadge status={tenant.status} /></td>
                  <td className="px-5 py-4 text-right"><TenantActionsMenu tenant={tenant} /></td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
        {!isLoading && !errorMessage && filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={28} />} title={search || statusFilter !== "ALL" ? "No matching tenants" : "No tenants yet"} description={search || statusFilter !== "ALL" ? "Adjust the search or lifecycle filter." : "Registered tenant workspaces will appear here."} />
        ) : null}
        {!isLoading && !errorMessage && filtered.length > 0 ? (
          <Pagination
            currentPage={tenantPagination.currentPage}
            totalItems={filtered.length}
            pageSize={tenantPagination.pageSize}
            onPageChange={tenantPagination.setCurrentPage}
            onPageSizeChange={tenantPagination.setPageSize}
            itemLabel="companies"
          />
        ) : null}
      </SectionCard>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ color, background: `${color}12` }}>{icon}</span>
      <div><p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p></div>
    </div>
  );
}
