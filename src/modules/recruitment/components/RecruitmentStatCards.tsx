import { BriefcaseBusiness, CalendarClock, Users, BadgeCheck } from "lucide-react";
import { StatCard } from "@/components/common/AppUI";
import type { RecruitmentDashboard } from "@/modules/recruitment/types";

export function RecruitmentStatCards({ dashboard }: { dashboard: RecruitmentDashboard }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Open jobs" value={dashboard.openJobs} icon={<BriefcaseBusiness size={18} />} />
      <StatCard label="Candidates" value={dashboard.totalCandidates} icon={<Users size={18} />} accentColor="#2563eb" />
      <StatCard label="Active applications" value={dashboard.activeApplications} icon={<BadgeCheck size={18} />} accentColor="#0f766e" />
      <StatCard label="Upcoming interviews" value={dashboard.upcomingInterviews} icon={<CalendarClock size={18} />} accentColor="#b45309" />
    </div>
  );
}