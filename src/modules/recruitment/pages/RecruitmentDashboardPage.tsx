import { useMemo } from "react";
import { BriefcaseBusiness, ChevronRight, LayoutDashboard } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Button } from "@/components/common/Button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useRecruitmentDashboardQuery, useRecruitmentPipelineQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { RecruitmentStatCards } from "@/modules/recruitment/components/RecruitmentStatCards";
import { tenantRoutes } from "@/utils/tenantRoutes";

export function RecruitmentDashboardPage() {
  usePageMeta({ title: "Recruitment Overview", breadcrumb: ["Workspace", "Recruitment", "Overview"] });
  const { tenantSlug } = useParams();
  const dashboardQuery = useRecruitmentDashboardQuery();
  const pipelineQuery = useRecruitmentPipelineQuery();
  const jobsPath = tenantRoutes.recruitmentJobs(tenantSlug);
  const applicationsPath = tenantRoutes.recruitmentApplications(tenantSlug);

  const stageSummary = useMemo(() => dashboardQuery.data?.stageCounts ?? [], [dashboardQuery.data?.stageCounts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Overview"
        description="Track open jobs, candidate flow, interviews, and hiring decisions in one tenant-scoped workspace."
        actions={(
          <>
            <Button variant="outline" to={jobsPath}>
              <BriefcaseBusiness size={16} />
              Jobs
            </Button>
            <Button variant="primary" to={applicationsPath}>
              <LayoutDashboard size={16} />
              Applications
            </Button>
          </>
        )}
      />

      {dashboardQuery.isError ? (
        <ErrorBanner message="Failed to load recruitment dashboard." onRetry={() => void dashboardQuery.refetch()} />
      ) : dashboardQuery.isLoading || !dashboardQuery.data ? (
        <SectionCard variant="plain">
          <SkeletonRow cols={4} />
          <SkeletonRow cols={4} />
        </SectionCard>
      ) : (
        <>
          <RecruitmentStatCards dashboard={dashboardQuery.data} />

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard title="Hiring stages" subtitle="Live breakdown of the current hiring funnel.">
              <div className="space-y-4">
                {stageSummary.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stage.stage.replaceAll("_", " ")}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{stage.count}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top jobs" subtitle="Roles that currently have the most applications.">
              <div className="space-y-3">
                {dashboardQuery.data.jobCounts.length === 0 ? (
                  <EmptyState title="No jobs yet" description="Create a job opening to begin tracking applications." />
                ) : dashboardQuery.data.jobCounts.slice(0, 5).map((job) => (
                  <Link key={job.jobPositionId} to={jobsPath} className="flex items-center justify-between rounded-xl border p-4 no-underline transition hover:-translate-y-0.5" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{job.count} application{job.count === 1 ? "" : "s"}</p>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />
                  </Link>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Pipeline preview" subtitle="Move to the full kanban to update stages.">
            {pipelineQuery.isLoading || !pipelineQuery.data ? (
              <SkeletonRow cols={4} />
            ) : pipelineQuery.isError ? (
              <ErrorBanner message="Failed to load pipeline preview." onRetry={() => void pipelineQuery.refetch()} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {pipelineQuery.data.columns.map((column) => (
                  <div key={column.stage} className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{column.label}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{column.count} candidate{column.count === 1 ? "" : "s"}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
