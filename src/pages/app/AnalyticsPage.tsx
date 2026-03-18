import { useEffect, useState } from "react";
import { BarChart3, CalendarClock, CheckSquare2, ClipboardList, Users } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getTenantAnalyticsData } from "@/modules/analytics/services/analyticsService";
import { AttendanceTrendChart } from "@/modules/analytics/components/AttendanceTrendChart";
import { BarChart } from "@/modules/analytics/components/BarChart";
import { DonutChart } from "@/modules/analytics/components/DonutChart";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorBanner, StatCard } from "@/components/common/AppUI";
import type { TenantAnalyticsData } from "@/modules/analytics/types";

export function AnalyticsPage() {
  usePageMeta({ title: "Analytics", breadcrumb: ["Workspace", "Analytics"] });

  const [data, setData] = useState<TenantAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const response = await getTenantAnalyticsData();
      setData(response);
    } catch {
      setError("Unable to load analytics right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workforce Analytics"
        description="Operational insight across tasks, projects, attendance, and leave."
      />

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {loading && (
        <SectionCard>
          <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Employees" value={data.totalEmployees} icon={<Users size={18} />} accentColor="#9332EA" />
            <StatCard label="Active Projects" value={data.activeProjects} icon={<ClipboardList size={18} />} accentColor="#6366f1" />
            <StatCard label="Open Tasks" value={data.openTasks} icon={<CheckSquare2 size={18} />} accentColor="#d97706" />
            <StatCard label="Pending Leaves" value={data.pendingLeaves} icon={<CalendarClock size={18} />} accentColor="#ef4444" />
            <StatCard label="Present Today" value={data.presentToday} icon={<BarChart3 size={18} />} accentColor="#10b981" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DonutChart title="Task Status Distribution" data={data.taskStatusDistribution} />
            <DonutChart title="Leave Status Distribution" data={data.leaveStatusDistribution} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <BarChart title="Project Progress" subtitle="Top project completion percentages" data={data.projectProgress} unit="%" />
            <BarChart title="Employee Workload" subtitle="Task count by assignee" data={data.workloadByEmployee} color="#6366f1" />
          </div>

          <AttendanceTrendChart title="Attendance Trend" data={data.attendanceTrend} />

          <SectionCard title="Upcoming Deadlines" subtitle="Near-term task deadlines to watch.">
            <div className="space-y-2">
              {data.upcomingDeadlines.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No deadlines found.
                </p>
              )}
              {data.upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {task.status.replace("_", " ")} · {task.priority}
                    </p>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: "var(--color-primary-600)" }}>
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
