import type { ReactNode } from "react";
import { CalendarClock, CheckSquare, FolderOpen, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState, ErrorBanner, SkeletonRow, StatCard } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTenantAnalyticsQuery, useTenantDashboardQuery } from "@/hooks/queries/useDashboardQueries";
import { formatDate, toReadableLabel } from "@/utils/formatting";

export function ReportsPage() {
  usePageMeta({ title: "Reports", breadcrumb: ["Workspace", "Reports"] });

  const dashboardQuery = useTenantDashboardQuery();
  const analyticsQuery = useTenantAnalyticsQuery();
  const dashboard = dashboardQuery.data;
  const analytics = analyticsQuery.data;
  const loading = dashboardQuery.isLoading || analyticsQuery.isLoading;
  const hasError = dashboardQuery.isError || analyticsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational employee, attendance, leave, project, and task reports from existing WorkNest analytics."
      />

      {hasError ? (
        <ErrorBanner
          message="Failed to load reports."
          onRetry={() => {
            void dashboardQuery.refetch();
            void analyticsQuery.refetch();
          }}
        />
      ) : null}

      {loading || !dashboard || !analytics ? (
        <SectionCard variant="plain">
          {Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={4} />)}
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Employees" value={analytics.totalEmployees} icon={<Users size={20} />} />
            <StatCard label="Present Today" value={analytics.presentToday} icon={<CalendarClock size={20} />} accentColor="#10b981" />
            <StatCard label="Pending Leave" value={analytics.pendingLeaves} icon={<CalendarClock size={20} />} accentColor="#d97706" />
            <StatCard label="Active Projects" value={analytics.activeProjects} icon={<FolderOpen size={20} />} accentColor="#2563eb" />
            <StatCard label="Open Tasks" value={analytics.openTasks} icon={<CheckSquare size={20} />} accentColor="#9332EA" />
          </div>

          <ReportSection
            title="Employee Report"
            description="Employee role distribution from existing analytics."
            empty={!analytics.totalEmployees}
          >
            <MetricRows rows={analytics.totalEmployees ? [{ label: "Total Employees", value: analytics.totalEmployees }] : []} />
          </ReportSection>

          <ReportSection
            title="Attendance Report"
            description="Today and recent attendance activity."
            empty={dashboard.attendanceSummary.total === 0 && analytics.attendanceTrend.length === 0}
          >
            <MetricRows
              rows={[
                { label: "Total Records", value: dashboard.attendanceSummary.total },
                { label: "Present", value: dashboard.attendanceSummary.present },
                { label: "Late", value: dashboard.attendanceSummary.late },
                { label: "Half Day", value: dashboard.attendanceSummary.halfDay },
                { label: "Incomplete", value: dashboard.attendanceSummary.incomplete },
                { label: "Absent", value: dashboard.attendanceSummary.absent },
              ]}
            />
            <MiniTable
              headers={["Date", "Present", "Late", "Absent"]}
              rows={analytics.attendanceTrend.slice(-7).map((item) => [
                formatDate(item.date),
                String(item.present),
                String(item.late),
                String(item.absent),
              ])}
            />
          </ReportSection>

          <ReportSection
            title="Leave Report"
            description="Leave status distribution and recent leave requests."
            empty={analytics.leaveStatusDistribution.length === 0 && dashboard.recentLeaves.length === 0}
          >
            <MetricRows rows={analytics.leaveStatusDistribution.map((item) => ({ label: item.label, value: item.value }))} />
            <MiniTable
              headers={["Employee", "Type", "Dates", "Status"]}
              rows={dashboard.recentLeaves.map((leave) => [
                leave.employeeName || "-",
                toReadableLabel(leave.leaveType || "-"),
                `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`,
                toReadableLabel(leave.status),
              ])}
            />
          </ReportSection>

          <ReportSection
            title="Project Report"
            description="Project progress from analytics."
            empty={analytics.projectProgress.length === 0}
          >
            <MetricRows rows={analytics.projectProgress.map((item) => ({ label: item.label, value: `${item.value}%` }))} />
          </ReportSection>

          <ReportSection
            title="Task Report"
            description="Task status, workload, and upcoming deadlines."
            empty={analytics.taskStatusDistribution.length === 0 && analytics.upcomingDeadlines.length === 0}
          >
            <MetricRows rows={analytics.taskStatusDistribution.map((item) => ({ label: item.label, value: item.value }))} />
            <MiniTable
              headers={["Task", "Due Date", "Priority", "Status"]}
              rows={analytics.upcomingDeadlines.map((task) => [
                task.title,
                formatDate(task.dueDate),
                toReadableLabel(task.priority),
                toReadableLabel(task.status),
              ])}
            />
            <MetricRows rows={analytics.workloadByEmployee.map((item) => ({ label: item.label, value: item.value }))} />
          </ReportSection>
        </>
      )}
    </div>
  );
}

function ReportSection({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <SectionCard title={title} subtitle={description}>
      {empty ? <EmptyState title="No report data" description="No source records are available for this report yet." /> : <div className="space-y-5">{children}</div>}
    </SectionCard>
  );
}

function MetricRows({ rows }: { rows: Array<{ label: string; value: string | number }> }) {
  if (rows.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{row.label}</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{row.value}</p>
        </div>
      ))}
    </div>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-default)" }}>
      <table className="min-w-full text-left text-sm">
        <thead style={{ color: "var(--text-secondary)" }}>
          <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
            {headers.map((header) => <th key={header} className="px-4 py-3 font-medium">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-b last:border-b-0" style={{ borderColor: "var(--border-default)" }}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`} className="px-4 py-3" style={{ color: index === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
