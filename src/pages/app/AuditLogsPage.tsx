import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { AppSelect } from "@/components/common/AppSelect";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getAuditLogs, type AuditActionType, type AuditEntityType, type AuditLogQuery } from "@/modules/audit/services/auditLogService";
import { formatDateTime, toReadableLabel } from "@/utils/formatting";
import { Pagination } from "@/components/common/Pagination";
import { readPageSize, writePageSize } from "@/hooks/useClientPagination";

const ACTION_OPTIONS: AuditActionType[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PROVISION",
  "ASSIGN",
  "APPROVE",
  "REJECT",
  "CANCEL",
  "SEND_MESSAGE",
  "MARK_READ",
  "UPLOAD",
  "DOWNLOAD",
  "SHORTLIST",
  "SCHEDULE",
  "SUBMIT_FEEDBACK",
  "LOGIN",
  "CANDIDATE_APPLIED",
];

const ENTITY_OPTIONS: AuditEntityType[] = [
  "EMPLOYEE",
  "TEAM",
  "PROJECT",
  "TASK",
  "LEAVE_REQUEST",
  "ANNOUNCEMENT",
  "ATTACHMENT",
  "JOB_POSITION",
  "CANDIDATE",
  "CANDIDATE_APPLICATION",
  "CANDIDATE_COMMENT",
  "INTERVIEW",
  "INTERVIEW_FEEDBACK",
  "HR_MESSAGE",
  "TEAM_CHAT",
  "TEAM_CHAT_MESSAGE",
  "NOTIFICATION",
];

export function AuditLogsPage() {
  usePageMeta({ title: "Audit Logs", breadcrumb: ["Workspace", "Administration", "Audit Logs"] });

  const [query, setQuery] = useState<AuditLogQuery>(() => ({ page: 0, size: readPageSize("audit-logs", 10) }));
  const [search, setSearch] = useState("");

  const auditQuery = useQuery({
    queryKey: ["audit-logs", query],
    queryFn: () => getAuditLogs(query),
    staleTime: 15_000,
  });

  const employeesQuery = useQuery({
    queryKey: ["audit-logs", "employees"],
    queryFn: getEmployees,
    staleTime: 60_000,
  });

  const filteredLogs = useMemo(() => {
    const logs = auditQuery.data?.items ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return logs;

    return logs.filter((log) =>
      [
        log.actorName,
        log.actorEmail,
        log.action,
        log.entityType,
        log.entityId,
        log.metadataJson,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [auditQuery.data?.items, search]);

  function updateFilter(next: Partial<AuditLogQuery>) {
    setQuery((current) => ({ ...current, ...next, page: 0 }));
  }

  const page = auditQuery.data?.page ?? 0;
  const pageSize = auditQuery.data?.size ?? query.size ?? 10;

  function handlePageSizeChange(size: number) {
    writePageSize("audit-logs", size);
    setQuery((current) => ({ ...current, page: 0, size }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Review tenant activity by user, action, entity, and date."
        actions={(
          <Button variant="outline" onClick={() => void auditQuery.refetch()}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        )}
      />

      <SectionCard title="Filters" subtitle="Narrow audit events to support operational investigation.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <AppSelect value={query.action ?? ""} onChange={(event) => updateFilter({ action: event.target.value || undefined })}>
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((action) => <option key={action} value={action}>{toReadableLabel(action)}</option>)}
          </AppSelect>
          <AppSelect value={query.entityType ?? ""} onChange={(event) => updateFilter({ entityType: event.target.value || undefined })}>
            <option value="">All Entities</option>
            {ENTITY_OPTIONS.map((entity) => <option key={entity} value={entity}>{toReadableLabel(entity)}</option>)}
          </AppSelect>
          <AppSelect value={query.actorId ?? ""} onChange={(event) => updateFilter({ actorId: event.target.value || undefined })}>
            <option value="">All Users</option>
            {(employeesQuery.data ?? []).map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name || employee.email}</option>
            ))}
          </AppSelect>
          <Input id="audit-from" label="From Date" type="date" value={query.fromDate ?? ""} onChange={(event) => updateFilter({ fromDate: event.target.value || undefined })} />
          <Input id="audit-to" label="To Date" type="date" value={query.toDate ?? ""} onChange={(event) => updateFilter({ toDate: event.target.value || undefined })} />
        </div>
        <div className="mt-4">
          <Input
            id="audit-search"
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search actor, entity, action, metadata"
          />
        </div>
      </SectionCard>

      <SectionCard title="Activity" subtitle={`${auditQuery.data?.totalElements ?? 0} audit event${(auditQuery.data?.totalElements ?? 0) === 1 ? "" : "s"} found.`} variant="table">
        {auditQuery.isError ? (
          <ErrorBanner message="Failed to load audit logs." onRetry={() => void auditQuery.refetch()} />
        ) : auditQuery.isLoading ? (
          <div>{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={5} />)}</div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState icon={<ClipboardList size={24} />} title="No audit logs found" description="Adjust filters or search to review tenant activity." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead style={{ color: "var(--text-secondary)" }}>
                  <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Actor</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Entity</th>
                    <th className="px-5 py-3 font-medium">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border-default)" }}>
                      <td className="whitespace-nowrap px-5 py-3" style={{ color: "var(--text-secondary)" }}>{formatDateTime(log.createdAt)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{log.actorName || log.actorEmail || "System"}</p>
                        {log.actorEmail ? <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{log.actorEmail}</p> : null}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{toReadableLabel(log.action)}</td>
                      <td className="whitespace-nowrap px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                        {toReadableLabel(log.entityType)}{log.entityId ? ` #${log.entityId}` : ""}
                      </td>
                      <td className="max-w-xs truncate px-5 py-3" style={{ color: "var(--text-secondary)" }}>{log.metadataJson || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page + 1}
              totalItems={auditQuery.data?.totalElements ?? 0}
              pageSize={pageSize}
              onPageChange={(nextPage) => setQuery((current) => ({ ...current, page: nextPage - 1 }))}
              onPageSizeChange={handlePageSizeChange}
              itemLabel="audit events"
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
