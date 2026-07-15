import { ArrowRight, BriefcaseBusiness, CalendarClock, FileText, Plus } from "lucide-react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { LoadingSkeleton } from "@/components/common/AsyncStates";
import { RecruitmentStatCards } from "@/modules/recruitment/components/RecruitmentStatCards";
import { RecruitmentStatusBadge } from "@/modules/recruitment/components/RecruitmentStatusBadge";
import { useRecruitmentDashboardQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { usePageMeta } from "@/hooks/usePageMeta";

export function RecruitmentDashboardPage() {
  usePageMeta({ title: "Recruitment Dashboard", breadcrumb: ["Workspace", "Recruitment", "Dashboard"] });
  const { tenantSlug = "" } = useParams();
  const dashboardQuery = useRecruitmentDashboardQuery();
  if (dashboardQuery.isLoading) return <LoadingSkeleton lines={12} />;
  if (dashboardQuery.isError || !dashboardQuery.data) return <ErrorBanner message="Could not load the recruitment dashboard." onRetry={() => void dashboardQuery.refetch()} />;
  const dashboard = dashboardQuery.data;
  return <div className="space-y-6">
    <PageHeader title="Recruitment Dashboard" description="A focused view of the hiring work that needs attention today." actions={<><Button variant="outline" to={tenantRoutes.recruitmentApplications(tenantSlug)}><FileText size={16} />View Applications</Button><Button to={tenantRoutes.recruitmentJobNew(tenantSlug)}><Plus size={16} />New Job Opening</Button></>} />
    <RecruitmentStatCards dashboard={dashboard} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
      <SectionCard title="Recent applications" subtitle="The newest candidates across all open jobs." action={<Button size="sm" variant="ghost" to={tenantRoutes.recruitmentApplications(tenantSlug)}>View all<ArrowRight size={14} /></Button>}>
        {dashboard.recentApplications.length ? <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>{dashboard.recentApplications.map((item) => <a key={item.id} href={tenantRoutes.recruitmentApplication(item.id, tenantSlug)} className="flex items-center justify-between gap-4 py-3 no-underline first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.candidate.fullName}</p><p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-secondary)" }}>{item.jobPosition.title} · {formatDate(item.appliedAt)}</p></div><RecruitmentStatusBadge value={item.status} /></a>)}</div> : <EmptyState icon={<FileText size={28} />} title="No applications yet" description="New applications will appear here as candidates submit them." />}
      </SectionCard>
      <SectionCard title="Upcoming interviews" subtitle="Scheduled and rescheduled interviews from now onward.">
        {dashboard.upcomingInterviewItems.length ? <div className="space-y-3">{dashboard.upcomingInterviewItems.map((item) => <a key={item.id} href={tenantRoutes.recruitmentApplication(item.applicationId, tenantSlug)} className="flex gap-3 rounded-xl border p-3 no-underline" style={{ borderColor: "var(--border-default)" }}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><CalendarClock size={18} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.candidate.fullName}</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{formatDateTime(item.scheduledAt)} · {item.mode === "REMOTE" ? "Online" : "Physical"}</p></div></a>)}</div> : <EmptyState icon={<CalendarClock size={28} />} title="No upcoming interviews" description="Schedule an interview from an application when a candidate is ready." />}
      </SectionCard>
    </div>
    <SectionCard title="Recently published jobs" subtitle="The latest openings candidates can see on your careers page." action={<Button size="sm" variant="ghost" to={tenantRoutes.recruitmentJobs(tenantSlug)}>Manage jobs<ArrowRight size={14} /></Button>}>
      {dashboard.recentlyPublishedJobs.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{dashboard.recentlyPublishedJobs.map((job) => <article key={job.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)" }}><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600"><BriefcaseBusiness size={18} /></span><span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{job.applicationCount} applicants</span></div><p className="mt-3 font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{job.department ?? "No department"} · Published {formatDate(job.publishedAt)}</p></article>)}</div> : <EmptyState title="No published jobs" description="Publish a completed draft to make it appear on the careers page." />}
    </SectionCard>
  </div>;
}

function formatDate(value?: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
function formatDateTime(value?: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
