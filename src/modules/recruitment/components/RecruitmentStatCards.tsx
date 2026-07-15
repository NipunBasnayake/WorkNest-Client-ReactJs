import { BriefcaseBusiness, CalendarClock, FileText, Send, ThumbsUp, UserCheck, UserX } from "lucide-react";
import type { RecruitmentDashboard } from "@/modules/recruitment/types";

export function RecruitmentStatCards({ dashboard }: { dashboard: RecruitmentDashboard }) {
  const cards = [
    { label: "Open Jobs", value: dashboard.openJobs, icon: BriefcaseBusiness, color: "#7c3aed" },
    { label: "Applications", value: dashboard.applicationsReceived, icon: FileText, color: "#2563eb" },
    { label: "Shortlisted", value: dashboard.shortlisted, icon: ThumbsUp, color: "#0891b2" },
    { label: "Interviews", value: dashboard.interviewScheduled, icon: CalendarClock, color: "#d97706" },
    { label: "Offers", value: dashboard.offersSent, icon: Send, color: "#9333ea" },
    { label: "Hired", value: dashboard.hiredCandidates, icon: UserCheck, color: "#059669" },
    { label: "Rejected", value: dashboard.rejected, icon: UserX, color: "#dc2626" },
  ];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">{cards.map(({ label, value, icon: Icon, color }) => <article key={label} className="rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}><div className="flex items-center justify-between gap-3"><div><p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{value.toLocaleString()}</p><p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}16`, color }}><Icon size={19} /></span></div></article>)}</div>;
}
