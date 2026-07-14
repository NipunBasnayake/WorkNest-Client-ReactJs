import { useMemo, useState } from "react";
import { FileClock, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformAuditEventsQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState } from "@/components/common/AsyncStates";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchField } from "@/components/common/SearchField";
import { SectionCard } from "@/components/common/SectionCard";
import { SkeletonRow } from "@/components/common/AppUI";
import { PlatformStatusBadge } from "@/modules/platform/components/PlatformStatusBadge";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatDateTime, formatRelativeTime } from "@/utils/formatting";
import { Pagination } from "@/components/common/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";

export function PlatformAuditLogsPage() {
  usePageMeta({ title: "Platform Audit Logs", breadcrumb: ["Platform", "Audit Logs"] });
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const { data: events = [], error, isLoading, refetch } = usePlatformAuditEventsQuery(true);
  const tenantFilter = params.get("tenant")?.toLowerCase();
  const errorMessage = error ? getErrorMessage(error, "Unable to load platform audit events.") : null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => (!tenantFilter || event.tenantKey.toLowerCase() === tenantFilter)
      && (status === "ALL" || event.newStatus === status)
      && (!query || [event.companyName, event.tenantKey, event.actorEmail, event.previousStatus, event.newStatus]
        .some((value) => String(value ?? "").toLowerCase().includes(query))));
  }, [events, search, status, tenantFilter]);
  const auditPagination = useClientPagination(filtered, {
    storageKey: "platform-audit-events",
    resetKey: `${search}|${status}|${tenantFilter ?? ""}`,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Audit Logs" description="Immutable administrator-driven tenant lifecycle changes from the master database." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField label="Search audit events" placeholder="Company, tenant, actor, status..." value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} className="w-full sm:flex-1" />
        <label className="block min-w-52"><span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Resulting status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-xl border px-3 text-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}><option value="ALL">All statuses</option>{["ACTIVE", "PROVISIONING", "SUSPENDED", "INACTIVE", "ARCHIVED", "REJECTED"].map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}
      <SectionCard variant="table">
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left">
          <thead><tr className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)", color: "var(--text-tertiary)" }}><th className="px-5 py-3">Event</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Transition</th><th className="px-5 py-3">Occurred</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={4}>{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={4} />)}</td></tr> : null}
            {!isLoading && !errorMessage ? auditPagination.paginatedItems.map((event) => <tr key={event.id} className="border-b" style={{ borderColor: "var(--border-default)" }}>
              <td className="px-5 py-4"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-600"><ShieldCheck size={17} /></span><div><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Tenant lifecycle changed</p><Link to={`/platform/tenants/${event.tenantKey}`} className="mt-0.5 block text-xs text-purple-600 hover:underline">{event.companyName ?? event.tenantKey} · {event.tenantKey}</Link></div></div></td>
              <td className="px-4 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{event.actorEmail}</td>
              <td className="px-4 py-4"><div className="flex items-center gap-2"><PlatformStatusBadge status={event.previousStatus} /><span style={{ color: "var(--text-tertiary)" }}>→</span><PlatformStatusBadge status={event.newStatus} /></div></td>
              <td className="px-5 py-4"><p className="text-sm" style={{ color: "var(--text-primary)" }}>{formatRelativeTime(event.occurredAt)}</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(event.occurredAt)}</p></td>
            </tr>) : null}
          </tbody>
        </table></div>
        {!isLoading && !errorMessage && filtered.length === 0 ? <EmptyState icon={<FileClock size={28} />} title="No audit events found" description="Lifecycle changes will appear here after a platform administrator updates a tenant." /> : null}
        {!isLoading && !errorMessage && filtered.length > 0 ? (
          <Pagination
            currentPage={auditPagination.currentPage}
            totalItems={filtered.length}
            pageSize={auditPagination.pageSize}
            onPageChange={auditPagination.setCurrentPage}
            onPageSizeChange={auditPagination.setPageSize}
            itemLabel="audit events"
          />
        ) : null}
      </SectionCard>
    </div>
  );
}
