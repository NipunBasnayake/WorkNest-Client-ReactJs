import { useMemo } from "react";
import { Building2, Download, FileClock, FileSpreadsheet, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformDashboardQuery, usePlatformUsersQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { getErrorMessage } from "@/utils/errorHandler";

export function PlatformReportsPage() {
  usePageMeta({ title: "Platform Reports", breadcrumb: ["Platform", "Reports"] });
  const [params] = useSearchParams();
  const tenantFilter = params.get("tenant")?.toLowerCase();
  const snapshotQuery = usePlatformDashboardQuery(true);
  const usersQuery = usePlatformUsersQuery(true);
  const error = snapshotQuery.error ?? usersQuery.error;
  const errorMessage = error ? getErrorMessage(error, "Unable to prepare platform reports.") : null;
  const isLoading = snapshotQuery.isLoading || usersQuery.isLoading;
  const data = snapshotQuery.data;
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const tenants = useMemo(() => (data?.tenantHealth ?? []).filter((tenant) => !tenantFilter || tenant.tenantKey.toLowerCase() === tenantFilter), [data, tenantFilter]);
  const scopedUsers = useMemo(() => users.filter((user) => !tenantFilter || user.tenantKey?.toLowerCase() === tenantFilter), [tenantFilter, users]);

  function exportTenantPortfolio() {
    downloadCsv("worknest-tenant-portfolio.csv", ["Company", "Tenant Key", "Database", "Status", "Admin", "Admin Email", "Employees", "Projects", "Teams", "Tasks", "Last Login", "Last Activity", "Created"], tenants.map((tenant) => [tenant.companyName, tenant.tenantKey, tenant.databaseName, tenant.status, tenant.adminName, tenant.adminEmail, tenant.employeeCount, tenant.projectCount, tenant.teamCount, tenant.taskCount, tenant.lastLoginAt, tenant.lastActivityAt, tenant.createdAt]));
  }
  function exportUsers() {
    downloadCsv("worknest-platform-users.csv", ["Name", "Email", "Role", "Status", "Company", "Tenant Key", "Active Sessions", "Last Login", "Created"], scopedUsers.map((user) => [user.fullName, user.email, user.role, user.status, user.companyName, user.tenantKey, user.activeSessions, user.lastLoginAt, user.createdAt]));
  }
  function exportAudit() {
    downloadCsv("worknest-platform-audit.csv", ["Company", "Tenant Key", "Actor", "Previous Status", "New Status", "Occurred"], (data?.recentAuditEvents ?? []).filter((event) => !tenantFilter || event.tenantKey.toLowerCase() === tenantFilter).map((event) => [event.companyName, event.tenantKey, event.actorEmail, event.previousStatus, event.newStatus, event.occurredAt]));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Reports" description="Export auditable platform-wide tenant, identity, and lifecycle datasets." />
      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => { void snapshotQuery.refetch(); void usersQuery.refetch(); }} /> : null}
      {isLoading ? <SectionCard><LoadingSkeleton lines={8} className="h-64" /></SectionCard> : null}
      {!isLoading && !errorMessage && !data ? <EmptyState title="Reports unavailable" description="Platform report data could not be prepared." /> : null}
      {!isLoading && !errorMessage && data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <ReportCard icon={<Building2 size={22} />} title="Tenant portfolio" description="Lifecycle, administrator, database, usage, and activity fields for every company." rows={tenants.length} onExport={exportTenantPortfolio} />
          <ReportCard icon={<Users size={22} />} title="Platform identities" description="Platform-wide roles, tenant membership, account status, sessions, and login recency." rows={scopedUsers.length} onExport={exportUsers} />
          <ReportCard icon={<FileClock size={22} />} title="Lifecycle audit" description="Administrator, tenant, timestamp, and before/after status for recorded platform changes." rows={(data.recentAuditEvents ?? []).filter((event) => !tenantFilter || event.tenantKey.toLowerCase() === tenantFilter).length} onExport={exportAudit} />
        </div>
      ) : null}
      <SectionCard title="Report scope" subtitle="Exports reflect current backend data and do not fabricate unavailable billing, subscription, or storage fields.">
        <div className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}><FileSpreadsheet size={20} className="mt-0.5 shrink-0 text-purple-600" /><div><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{tenantFilter ? `Filtered to tenant: ${tenantFilter}` : "All platform tenants"}</p><p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>CSV files are generated locally from the authenticated operations APIs. Date values are exported in ISO format for downstream analysis.</p></div></div>
      </SectionCard>
    </div>
  );
}

function ReportCard({ icon, title, description, rows, onExport }: { icon: React.ReactNode; title: string; description: string; rows: number; onExport: () => void }) {
  return <SectionCard><div className="flex h-full flex-col"><span className="grid h-11 w-11 place-items-center rounded-xl bg-purple-500/10 text-purple-600">{icon}</span><h2 className="mt-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2><p className="mt-1 flex-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{description}</p><div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-default)" }}><span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{rows} rows</span><Button size="sm" variant="outline" onClick={onExport} disabled={rows === 0}><Download size={15} />Export CSV</Button></div></div></SectionCard>;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
