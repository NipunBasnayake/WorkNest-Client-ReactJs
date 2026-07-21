import { Link } from "react-router-dom";
import { BriefcaseBusiness, CalendarClock, ClipboardList, Send, UserCheck, UsersRound } from "lucide-react";
import { PageSection, StatCard } from "@/components/common/AppUI";
import { Button } from "@/components/common/Button";
import { SectionCard } from "@/components/common/SectionCard";
import { UserAvatar } from "@/components/common/UserAvatar";
import { RecruitmentStatusBadge } from "@/modules/recruitment/components/RecruitmentStatusBadge";
import type { RecruitmentDashboardSummary } from "@/modules/recruitment/types";
import { formatDateTime } from "@/utils/formatting";
import { tenantRoutes } from "@/utils/tenantRoutes";

export function RecruitmentDashboardWidget({ summary }: { summary: RecruitmentDashboardSummary }) {
  return (
    <PageSection
      title="Recruitment"
      description="Current hiring demand and the candidate activity that needs attention."
      action={<Button variant="outline" size="sm" to={tenantRoutes.recruitmentJobs()}>Manage Job Openings</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Open Jobs" value={summary.openJobs} icon={<BriefcaseBusiness size={20} />} accentColor="var(--color-primary-500)" />
        <StatCard label="Applications Received" value={summary.applicationsReceived} icon={<ClipboardList size={20} />} accentColor="#2563eb" />
        <StatCard label="Shortlisted" value={summary.shortlisted} icon={<UsersRound size={20} />} accentColor="#0891b2" />
        <StatCard label="Interviews Scheduled" value={summary.interviewsScheduled} icon={<CalendarClock size={20} />} accentColor="#d97706" />
        <StatCard label="Offers" value={summary.offers} icon={<Send size={20} />} accentColor="var(--color-primary-700)" />
        <StatCard label="Hired" value={summary.hired} icon={<UserCheck size={20} />} accentColor="#059669" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Recent Applications"
          subtitle="Newest candidates across current job openings."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.recruitmentApplications()}>View all</Button>}
        >
          {summary.recentApplications.length > 0 ? (
            <div className="space-y-3">
              {summary.recentApplications.map((application) => (
                <Link
                  key={application.id}
                  to={tenantRoutes.recruitmentApplication(application.id)}
                  className="group flex items-center gap-3 rounded-xl border p-3 no-underline transition-colors hover:bg-primary-500/[.04]"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <UserAvatar name={application.candidateName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{application.candidateName}</p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                      {application.jobTitle}{application.appliedAt ? ` · ${formatDateTime(application.appliedAt)}` : ""}
                    </p>
                  </div>
                  <RecruitmentStatusBadge value={application.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No applications have been received yet.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming Interviews"
          subtitle="Scheduled candidate conversations in chronological order."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.recruitmentApplications()}>Open applications</Button>}
        >
          {summary.upcomingInterviews.length > 0 ? (
            <div className="space-y-3">
              {summary.upcomingInterviews.map((interview) => (
                <Link
                  key={interview.id}
                  to={tenantRoutes.recruitmentApplication(interview.applicationId)}
                  className="group flex items-center gap-3 rounded-xl border p-3 no-underline transition-colors hover:bg-primary-500/[.04]"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <UserAvatar name={interview.candidateName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm" style={{ color: "var(--text-primary)" }}>{interview.candidateName}</strong>
                    <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                      {interview.jobTitle} · {formatDateTime(interview.scheduledAt)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--bg-muted)" }}>
                    {interview.mode === "REMOTE" ? "Online" : interview.mode === "ONSITE" ? "On-site" : "Phone"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No upcoming interviews are scheduled.</p>
          )}
        </SectionCard>
      </div>
    </PageSection>
  );
}
