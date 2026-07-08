import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { AppSelect } from "@/components/common/AppSelect";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/constants/permissions";
import { useRecruitmentApplicationsQuery, useRecruitmentInterviewsQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { scheduleInterview } from "@/modules/recruitment/services/recruitmentService";
import type { RecruitmentInterviewFormValues } from "@/modules/recruitment/types";
import { getErrorMessage } from "@/utils/errorHandler";

const EMPTY_FORM: RecruitmentInterviewFormValues = {
  applicationId: "",
  interviewerEmployeeId: "",
  scheduledAt: "",
  mode: "REMOTE",
  location: "",
  meetingLink: "",
  notes: "",
};

export function RecruitmentInterviewsPage() {
  usePageMeta({ title: "Recruitment Interviews", breadcrumb: ["Workspace", "Recruitment", "Interviews"] });
  const interviewsQuery = useRecruitmentInterviewsQuery();
  const applicationsQuery = useRecruitmentApplicationsQuery();
  const { hasPermission } = usePermission();
  const canScheduleInterview = hasPermission(PERMISSIONS.RECRUITMENT_SCHEDULE);
  const [form, setForm] = useState<RecruitmentInterviewFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canScheduleInterview) {
      setFeedback("You do not have permission to schedule interviews.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await scheduleInterview(form);
      await interviewsQuery.refetch();
      setForm(EMPTY_FORM);
      setFeedback("Interview scheduled successfully.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not schedule interview."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Interviews" description="Schedule and review upcoming interviews across the hiring pipeline." />

      {feedback ? <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>{feedback}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {canScheduleInterview ? (
          <SectionCard title="Schedule interview" subtitle="Create a new interview against an existing application.">
            <form className="space-y-4" onSubmit={handleSubmit}>
            <AppSelect value={form.applicationId} onChange={(event) => setForm((prev) => ({ ...prev, applicationId: event.target.value }))}>
              <option value="">Select application</option>
              {(applicationsQuery.data?.items ?? []).map((application) => (
                <option key={application.id} value={application.id}>
                  {application.candidate.fullName} - {application.jobPosition.title}
                </option>
              ))}
            </AppSelect>
            <Input id="interviewer" label="Interviewer employee ID" value={form.interviewerEmployeeId} onChange={(event) => setForm((prev) => ({ ...prev, interviewerEmployeeId: event.target.value }))} />
            <Input id="scheduled-at" label="Scheduled at" type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))} />
            <AppSelect value={form.mode} onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value as RecruitmentInterviewFormValues["mode"] }))}>
              <option value="REMOTE">Remote</option>
              <option value="ONSITE">On site</option>
              <option value="PHONE">Phone</option>
            </AppSelect>
            <Input id="location" label="Location" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
            <Input id="meeting-link" label="Meeting link" value={form.meetingLink} onChange={(event) => setForm((prev) => ({ ...prev, meetingLink: event.target.value }))} />
            <Input id="notes" label="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            <Button type="submit" loading={saving}>
              <CalendarPlus size={16} />
              Schedule Interview
            </Button>
            </form>
          </SectionCard>
        ) : (
          <SectionCard title="Interview access" subtitle="Interview scheduling is available to HR and tenant administrators.">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You can review upcoming interviews, but you do not have permission to schedule interviews.
            </p>
          </SectionCard>
        )}

        <SectionCard title="Upcoming interviews" subtitle="Interviews scheduled in the tenant workspace." variant="table">
          {interviewsQuery.isError ? (
            <ErrorBanner message="Failed to load interviews." onRetry={() => void interviewsQuery.refetch()} />
          ) : interviewsQuery.isLoading ? (
            <div>{Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} cols={4} />)}</div>
          ) : interviewsQuery.data?.length === 0 ? (
            <EmptyState title="No interviews scheduled" description="Schedule the first interview to coordinate the hiring process." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
              {(interviewsQuery.data ?? []).map((interview) => (
                <div key={interview.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{interview.candidate.fullName}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{interview.jobPosition.title}</p>
                    </div>
                    <div className="text-right text-xs" style={{ color: "var(--text-secondary)" }}>
                      <p>{interview.mode}</p>
                      <p>{interview.scheduledAt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
