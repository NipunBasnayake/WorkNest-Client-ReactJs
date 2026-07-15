import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Check, Download, ExternalLink, Mail, MessageSquarePlus, Send, UserRoundCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { AppSelect } from "@/components/common/AppSelect";
import { Badge } from "@/components/common/Badge";
import { ErrorBanner } from "@/components/common/AppUI";
import { LoadingSkeleton } from "@/components/common/AsyncStates";
import { RecruitmentStatusBadge } from "@/modules/recruitment/components/RecruitmentStatusBadge";
import { useApplicationWorkspaceQueries, useRecruitmentApplicationQuery, useRecruitmentEmailTemplatesQuery } from "@/modules/recruitment/hooks/useRecruitment";
import {
  addApplicationNote,
  hireApplication,
  scheduleInterview,
  sendApplicationEmail,
  updateApplicationStatus,
} from "@/modules/recruitment/services/recruitmentService";
import type { RecruitmentEmailTemplateType, RecruitmentHireFormValues, RecruitmentInterviewFormValues, RecruitmentStage } from "@/modules/recruitment/types";
import { useTeamsQuery } from "@/hooks/queries/useCoreQueries";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";

const EMAIL_LABELS: Record<RecruitmentEmailTemplateType, string> = {
  APPLICATION_RECEIVED: "Application received", SHORTLISTED: "Shortlisted", INTERVIEW_INVITATION: "Interview invitation",
  INTERVIEW_RESCHEDULED: "Interview rescheduled", OFFER: "Offer", REJECTED: "Rejected", WELCOME_EMPLOYEE: "Welcome employee",
};

const STAGE_LABELS: Record<RecruitmentStage, string> = { APPLIED: "Applied", SHORTLISTED: "Shortlisted", INTERVIEW: "Interview", OFFERED: "Offer", HIRED: "Hired", REJECTED: "Rejected" };

function availableStages(current: RecruitmentStage): RecruitmentStage[] {
  if (current === "APPLIED") return ["SHORTLISTED", "REJECTED"];
  if (current === "SHORTLISTED") return ["APPLIED", "INTERVIEW", "REJECTED"];
  if (current === "INTERVIEW") return ["SHORTLISTED", "OFFERED", "REJECTED"];
  if (current === "OFFERED") return ["INTERVIEW", "REJECTED"];
  return [];
}

function matchingEmail(stage: RecruitmentStage): RecruitmentEmailTemplateType | null {
  if (stage === "SHORTLISTED") return "SHORTLISTED";
  if (stage === "OFFERED") return "OFFER";
  if (stage === "REJECTED") return "REJECTED";
  return null;
}

export function RecruitmentApplicationDetailPage() {
  const { tenantSlug = "", applicationId } = useParams();
  usePageMeta({ title: "Application Review", breadcrumb: ["Workspace", "Recruitment", "Applications", "Review"] });
  const applicationQuery = useRecruitmentApplicationQuery(applicationId);
  const workspace = useApplicationWorkspaceQueries(applicationId);
  const templatesQuery = useRecruitmentEmailTemplatesQuery();
  const teamsQuery = useTeamsQuery(Boolean(applicationQuery.data));
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [nextStage, setNextStage] = useState<RecruitmentStage | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [sendStageEmail, setSendStageEmail] = useState(true);
  const [note, setNote] = useState("");
  const [emailType, setEmailType] = useState<RecruitmentEmailTemplateType>("SHORTLISTED");
  const [showInterview, setShowInterview] = useState(false);
  const [showHire, setShowHire] = useState(false);
  const [interviewForm, setInterviewForm] = useState<RecruitmentInterviewFormValues>({ applicationId: applicationId ?? "", scheduledAt: "", mode: "REMOTE", location: "", meetingLink: "", notes: "" });
  const [hireForm, setHireForm] = useState<RecruitmentHireFormValues>(() => emptyHireForm());

  const application = applicationQuery.data;
  const readOnly = application?.status === "HIRED";
  const stages = useMemo(() => application ? availableStages(application.status) : [], [application]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["recruitment"] });
  }

  async function moveStage() {
    if (!application || !nextStage) return;
    if (nextStage === "REJECTED" && !rejectionReason.trim()) {
      toast.error({ title: "Rejection reason required", description: "Add a short internal reason before rejecting this application." });
      return;
    }
    setBusy(true);
    try {
      await updateApplicationStatus(application.id, nextStage, rejectionReason.trim() || undefined);
      const template = matchingEmail(nextStage);
      if (sendStageEmail && template) await sendApplicationEmail(application.id, template);
      setNextStage(""); setRejectionReason("");
      await refresh();
      toast.success({ title: `Application moved to ${STAGE_LABELS[nextStage]}` });
    } catch (error) {
      toast.error({ title: "Could not move application", description: getErrorMessage(error, "Please try again.") });
    } finally { setBusy(false); }
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!application || !note.trim()) return;
    setBusy(true);
    try { await addApplicationNote(application.id, note.trim()); setNote(""); await refresh(); toast.success({ title: "Internal note added" }); }
    catch (error) { toast.error({ title: "Could not add note", description: getErrorMessage(error, "Please try again.") }); }
    finally { setBusy(false); }
  }

  async function sendEmail() {
    if (!application) return;
    setBusy(true);
    try { await sendApplicationEmail(application.id, emailType); await refresh(); toast.success({ title: "Candidate email queued", description: EMAIL_LABELS[emailType] }); }
    catch (error) { toast.error({ title: "Could not send email", description: getErrorMessage(error, "Please try again.") }); }
    finally { setBusy(false); }
  }

  async function createInterview(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await scheduleInterview({ ...interviewForm, applicationId: applicationId! });
      setShowInterview(false);
      setInterviewForm({ applicationId: applicationId!, scheduledAt: "", mode: "REMOTE", location: "", meetingLink: "", notes: "" });
      await refresh();
      toast.success({ title: "Interview scheduled", description: "The invitation email has been queued." });
    } catch (error) { toast.error({ title: "Could not schedule interview", description: getErrorMessage(error, "Check the date, time, and meeting details.") }); }
    finally { setBusy(false); }
  }

  function openHire() {
    if (!application) return;
    setHireForm({ ...emptyHireForm(), designation: application.candidate.currentTitle || application.jobPosition.title, department: application.jobPosition.department ?? "", salary: application.expectedSalary == null ? "" : String(application.expectedSalary) });
    setShowHire(true);
  }

  async function convertToEmployee(event: FormEvent) {
    event.preventDefault();
    if (!application) return;
    setBusy(true);
    try {
      const result = await hireApplication(application.id, hireForm);
      setShowHire(false);
      await refresh();
      toast.success({ title: `${result.employee.name} is now an employee`, description: "The job was closed automatically if all openings were filled." });
    } catch (error) { toast.error({ title: "Could not convert candidate", description: getErrorMessage(error, "Check the employee details and try again.") }); }
    finally { setBusy(false); }
  }

  if (applicationQuery.isLoading) return <LoadingSkeleton lines={12} />;
  if (applicationQuery.isError || !application) return <ErrorBanner message="Could not load this application." onRetry={() => void applicationQuery.refetch()} />;

  return <div className="space-y-6">
    <PageHeader
      title={application.candidate.fullName}
      description={`${application.jobPosition.title} · Applied ${formatDate(application.appliedAt)}`}
      backButton={<Button variant="ghost" size="sm" to={tenantRoutes.recruitmentApplications(tenantSlug)}><ArrowLeft size={15} />Back to applications</Button>}
      status={<RecruitmentStatusBadge value={application.status} />}
      actions={!readOnly ? <>{(application.status === "SHORTLISTED" || application.status === "INTERVIEW") ? <Button variant="outline" onClick={() => setShowInterview((current) => !current)}><CalendarClock size={16} />Schedule Interview</Button> : null}{application.status === "OFFERED" ? <Button onClick={openHire}><UserRoundCheck size={16} />Mark Hired & Convert</Button> : null}</> : application.hiredEmployeeId ? <Button variant="outline" to={tenantRoutes.employeeDetail(application.hiredEmployeeId, tenantSlug)}>View Employee<ExternalLink size={14} /></Button> : undefined}
    />

    {readOnly ? <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-700"><Check size={18} />This application is complete and read-only. The employee record has been created.</div> : null}

    {showInterview && !readOnly ? <InterviewForm form={interviewForm} setForm={setInterviewForm} busy={busy} onSubmit={createInterview} onCancel={() => setShowInterview(false)} /> : null}
    {showHire && !readOnly ? <HireForm form={hireForm} setForm={setHireForm} teams={teamsQuery.data ?? []} busy={busy} onSubmit={convertToEmployee} onCancel={() => setShowHire(false)} /> : null}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <div className="space-y-6">
        <SectionCard title="Candidate information" subtitle={application.referenceNumber ? `Application ${application.referenceNumber}` : undefined}>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Email" value={application.candidate.email} href={`mailto:${application.candidate.email}`} />
            <Info label="Phone" value={application.candidate.phone} href={application.candidate.phone ? `tel:${application.candidate.phone}` : undefined} />
            <Info label="Current position" value={application.candidate.currentTitle} />
            <Info label="Current company" value={application.candidate.currentCompany} />
            <Info label="Location" value={[application.candidate.currentCity, application.candidate.country].filter(Boolean).join(", ")} />
            <Info label="Expected salary" value={application.expectedSalary == null ? undefined : String(application.expectedSalary)} />
            <Info label="LinkedIn" value={application.candidate.linkedinUrl} href={application.candidate.linkedinUrl} />
            <Info label="Portfolio" value={application.candidate.portfolioUrl} href={application.candidate.portfolioUrl} />
            <Info label="Source" value={application.source ?? application.candidate.source} />
          </dl>
        </SectionCard>

        <SectionCard title="Resume" action={application.candidate.resumeFileUrl ? <Button variant="outline" size="sm" onClick={() => window.open(application.candidate.resumeFileUrl, "_blank", "noopener,noreferrer")}><Download size={14} />Download CV</Button> : undefined}>
          {application.candidate.resumeFileUrl && application.candidate.resumeMimeType?.includes("pdf") ? <iframe title={`${application.candidate.fullName} resume`} src={application.candidate.resumeFileUrl} className="h-[38rem] w-full rounded-xl border" style={{ borderColor: "var(--border-default)" }} />
            : application.candidate.resumeFileUrl ? <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}><p className="font-medium" style={{ color: "var(--text-primary)" }}>{application.candidate.resumeFileName ?? "Resume attached"}</p><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Preview is available for PDF files. Open the document to review this resume.</p></div>
              : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No resume is attached.</p>}
        </SectionCard>

        <SectionCard title="Cover letter"><p className="whitespace-pre-wrap text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{application.coverLetter || "No cover letter was provided."}</p></SectionCard>

        <SectionCard title="Internal HR notes" subtitle="Private notes are visible only to HR and tenant administrators.">
          {!readOnly ? <form className="mb-5 flex flex-col gap-3 sm:flex-row" onSubmit={addNote}><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a clear, useful note for the hiring record" className="min-h-20 flex-1 rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:border-purple-500" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }} /><Button type="submit" loading={busy} disabled={!note.trim()}><MessageSquarePlus size={15} />Add Note</Button></form> : null}
          <div className="space-y-3">{workspace.notes.isLoading ? <LoadingSkeleton lines={3} /> : (workspace.notes.data ?? []).length ? (workspace.notes.data ?? []).map((item) => <div key={item.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}><p className="whitespace-pre-wrap text-sm" style={{ color: "var(--text-primary)" }}>{item.message}</p><p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>{item.author?.name ?? "HR"} · {formatDateTime(item.createdAt)}</p></div>) : <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No internal notes yet.</p>}</div>
        </SectionCard>
      </div>

      <aside className="space-y-6">
        {!readOnly ? <SectionCard title="Move stage" subtitle="Only the next practical steps are available.">
          <div className="space-y-3"><AppSelect aria-label="Next application stage" value={nextStage} onChange={(event) => setNextStage(event.target.value as RecruitmentStage | "")}><option value="">Choose next stage</option>{stages.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}</AppSelect>
            {nextStage === "REJECTED" ? <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Internal rejection reason (required)" className="min-h-24 w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-default)" }} /> : null}
            {matchingEmail(nextStage as RecruitmentStage) ? <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={sendStageEmail} onChange={(event) => setSendStageEmail(event.target.checked)} className="accent-purple-600" />Send the matching candidate email</label> : null}
            <Button className="w-full" disabled={!nextStage} loading={busy} onClick={() => void moveStage()}>Move to {nextStage ? STAGE_LABELS[nextStage] : "stage"}</Button></div>
        </SectionCard> : null}

        <SectionCard title="Send email" subtitle="Messages use the templates configured for this company.">
          <div className="space-y-3"><AppSelect aria-label="Email template" value={emailType} onChange={(event) => setEmailType(event.target.value as RecruitmentEmailTemplateType)} disabled={readOnly}>{(templatesQuery.data ?? []).filter((template) => template.type !== "WELCOME_EMPLOYEE").map((template) => <option key={template.type} value={template.type}>{EMAIL_LABELS[template.type]}</option>)}</AppSelect><Button className="w-full" variant="outline" disabled={readOnly} loading={busy} onClick={() => void sendEmail()}><Send size={15} />Send Email</Button></div>
          <div className="mt-5 space-y-3 border-t pt-4" style={{ borderColor: "var(--border-default)" }}><h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Emails sent</h3>{(workspace.emails.data ?? []).length ? (workspace.emails.data ?? []).map((item) => <div key={item.id}><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.subject}</p><div className="mt-1 flex items-center gap-2"><Badge variant="success">{item.deliveryStatus.toLowerCase()}</Badge><span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(item.sentAt)}</span></div></div>) : <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No emails recorded yet.</p>}</div>
        </SectionCard>

        <SectionCard title="Interviews">
          <div className="space-y-3">{(workspace.interviews.data ?? []).length ? (workspace.interviews.data ?? []).map((item) => <div key={item.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)" }}><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatDateTime(item.scheduledAt)}</p><RecruitmentStatusBadge value={item.status} /></div><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{item.mode === "REMOTE" ? "Online" : item.mode === "ONSITE" ? "Physical" : "Phone"} · {item.meetingLink || item.location || "Details pending"}</p></div>) : <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No interview scheduled.</p>}</div>
        </SectionCard>

        <SectionCard title="Application timeline">
          <ol className="space-y-4">{(workspace.timeline.data ?? []).map((item) => <li key={item.id} className="relative border-l-2 border-purple-200 pl-4"><span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-purple-500" /><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>{item.detail ? <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{item.detail}</p> : null}<p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(item.occurredAt)}{item.actor?.name ? ` · ${item.actor.name}` : ""}</p></li>)}</ol>
        </SectionCard>
      </aside>
    </div>
  </div>;
}

function InterviewForm({ form, setForm, busy, onSubmit, onCancel }: { form: RecruitmentInterviewFormValues; setForm: React.Dispatch<React.SetStateAction<RecruitmentInterviewFormValues>>; busy: boolean; onSubmit: (event: FormEvent) => void; onCancel: () => void }) {
  return <SectionCard title="Schedule interview" subtitle="Keep scheduling simple. The candidate receives the interview invitation automatically."><form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}><Input id="interview-time" label="Date and time" type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} required /><label className="space-y-1.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}><span>Mode</span><AppSelect value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value as "REMOTE" | "ONSITE" }))}><option value="REMOTE">Online</option><option value="ONSITE">Physical</option></AppSelect></label>{form.mode === "REMOTE" ? <Input id="meeting-link" label="Meeting link" type="url" value={form.meetingLink} onChange={(event) => setForm((current) => ({ ...current, meetingLink: event.target.value }))} placeholder="https://meet.google.com/..." required /> : <Input id="interview-location" label="Location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Meeting room or office address" required />}<Input id="interview-notes" label="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional preparation notes" /><div className="flex gap-2 md:col-span-2 xl:col-span-4 xl:justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={busy}><Mail size={15} />Schedule & Send Invitation</Button></div></form></SectionCard>;
}

function HireForm({ form, setForm, teams, busy, onSubmit, onCancel }: { form: RecruitmentHireFormValues; setForm: React.Dispatch<React.SetStateAction<RecruitmentHireFormValues>>; teams: Array<{ id: string | number; name: string }>; busy: boolean; onSubmit: (event: FormEvent) => void; onCancel: () => void }) {
  return <SectionCard title="Convert to employee" subtitle="Confirm the employee record, login account, and optional team assignment. The application becomes read-only after conversion."><form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}><Input id="employee-code" label="Employee code" value={form.employeeCode} onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value.toUpperCase() }))} placeholder="Auto-generated if blank" /><Input id="employee-designation" label="Designation" value={form.designation} onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))} required /><Input id="employee-department" label="Department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} required /><label className="space-y-1.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}><span>Role</span><AppSelect value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "EMPLOYEE" | "MANAGER" }))}><option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option></AppSelect></label><Input id="joined-date" label="Joined date" type="date" value={form.joinedDate} onChange={(event) => setForm((current) => ({ ...current, joinedDate: event.target.value }))} required /><Input id="employee-salary" label="Salary" type="number" min="0" value={form.salary} onChange={(event) => setForm((current) => ({ ...current, salary: event.target.value }))} /><label className="space-y-1.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}><span>Team</span><AppSelect value={form.teamId} onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}><option value="">No team assignment</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</AppSelect></label><Input id="temporary-password" label="Temporary password (optional)" type="password" minLength={8} value={form.temporaryPassword} onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))} placeholder="Securely generated if blank" /><div className="md:col-span-2 xl:col-span-4"><label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Handoff notes</label><textarea value={form.recruiterNotes} onChange={(event) => setForm((current) => ({ ...current, recruiterNotes: event.target.value }))} className="min-h-20 w-full rounded-xl border bg-transparent px-4 py-3 text-sm" style={{ borderColor: "var(--border-default)" }} /></div><div className="flex gap-2 md:col-span-2 xl:col-span-4 xl:justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={busy}><UserRoundCheck size={15} />Create Employee & Complete Hire</Button></div></form></SectionCard>;
}

function Info({ label, value, href }: { label: string; value?: string; href?: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</dt><dd className="mt-1 break-words text-sm" style={{ color: "var(--text-primary)" }}>{value ? href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-purple-600 hover:underline">{value}</a> : value : "—"}</dd></div>; }

function emptyHireForm(): RecruitmentHireFormValues { return { employeeCode: "", role: "EMPLOYEE", designation: "", department: "", joinedDate: new Date().toISOString().slice(0, 10), temporaryPassword: "", teamId: "", teamFunctionalRole: "MEMBER", salary: "", recruiterNotes: "" }; }
function formatDate(value?: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
function formatDateTime(value?: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); }
