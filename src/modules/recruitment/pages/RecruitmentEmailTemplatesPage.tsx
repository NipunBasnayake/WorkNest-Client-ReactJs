import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Save } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { LoadingSkeleton } from "@/components/common/AsyncStates";
import { MarkdownContent } from "@/modules/recruitment/components/MarkdownContent";
import { useRecruitmentEmailTemplatesQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { updateEmailTemplate } from "@/modules/recruitment/services/recruitmentService";
import type { RecruitmentEmailTemplate, RecruitmentEmailTemplateType } from "@/modules/recruitment/types";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";

const LABELS: Record<RecruitmentEmailTemplateType, string> = {
  APPLICATION_RECEIVED: "Application Received", SHORTLISTED: "Shortlisted", INTERVIEW_INVITATION: "Interview Invitation",
  INTERVIEW_RESCHEDULED: "Interview Rescheduled", OFFER: "Offer", REJECTED: "Rejected", WELCOME_EMPLOYEE: "Welcome Employee",
};

export function RecruitmentEmailTemplatesPage() {
  usePageMeta({ title: "Recruitment Email Templates", breadcrumb: ["Workspace", "Recruitment", "Email Templates"] });
  const templatesQuery = useRecruitmentEmailTemplatesQuery();
  const [selectedType, setSelectedType] = useState<RecruitmentEmailTemplateType>("APPLICATION_RECEIVED");
  const [draft, setDraft] = useState<RecruitmentEmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  const selected = templatesQuery.data?.find((template) => template.type === selectedType);

  useEffect(() => { if (selected) setDraft({ ...selected }); }, [selected]);

  async function save() {
    if (!draft || !draft.subject.trim() || !draft.bodyMarkdown.trim()) return;
    setSaving(true);
    try { await updateEmailTemplate(draft); await queryClient.invalidateQueries({ queryKey: ["recruitment", "email-templates"] }); toast.success({ title: `${LABELS[draft.type]} template saved` }); }
    catch (error) { toast.error({ title: "Could not save template", description: getErrorMessage(error, "Please try again.") }); }
    finally { setSaving(false); }
  }

  if (templatesQuery.isLoading) return <LoadingSkeleton lines={10} />;
  if (templatesQuery.isError) return <ErrorBanner message="Could not load recruitment email templates." onRetry={() => void templatesQuery.refetch()} />;

  return <div className="space-y-6">
    <PageHeader title="Email Templates" description="Keep candidate communication professional, consistent, and easy to send from each application." actions={<Button loading={saving} onClick={() => void save()} disabled={!draft}><Save size={16} />Save Template</Button>} />
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <SectionCard title="Templates" subtitle="Seven messages cover the full hiring flow.">
        <nav className="space-y-1" aria-label="Recruitment email templates">{(templatesQuery.data ?? []).map((template) => <button key={template.type} type="button" onClick={() => setSelectedType(template.type)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${selectedType === template.type ? "bg-purple-600 text-white shadow-sm" : "hover:bg-purple-500/5"}`} style={selectedType === template.type ? undefined : { color: "var(--text-secondary)" }}><Mail size={16} />{LABELS[template.type]}</button>)}</nav>
      </SectionCard>
      {draft ? <div className="space-y-6">
        <SectionCard title={LABELS[draft.type]} subtitle="Variables are replaced automatically when the message is sent.">
          <div className="space-y-5"><Input id="template-subject" label="Subject" value={draft.subject} onChange={(event) => setDraft((current) => current ? { ...current, subject: event.target.value } : current)} required />
            <div><label htmlFor="template-body" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Message (Markdown)</label><textarea id="template-body" value={draft.bodyMarkdown} onChange={(event) => setDraft((current) => current ? { ...current, bodyMarkdown: event.target.value } : current)} className="min-h-72 w-full rounded-2xl border bg-transparent p-4 font-mono text-sm leading-6 outline-none focus:border-purple-500" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }} /></div>
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Available variables</p><div className="flex flex-wrap gap-2">{draft.availableVariables.map((variable) => <button key={variable} type="button" onClick={() => setDraft((current) => current ? { ...current, bodyMarkdown: `${current.bodyMarkdown}${current.bodyMarkdown.endsWith(" ") ? "" : " "}{{${variable}}}` } : current)} className="rounded-lg border px-2.5 py-1.5 font-mono text-xs text-purple-600 hover:bg-purple-500/5" style={{ borderColor: "var(--border-default)" }}>{`{{${variable}}}`}</button>)}</div></div>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => current ? { ...current, enabled: event.target.checked } : current)} className="accent-purple-600" />Template enabled</label>
          </div>
        </SectionCard>
        <SectionCard title="Preview" subtitle="Example variables show how the candidate will read this message."><div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}><p className="mb-5 border-b pb-4 text-sm font-semibold" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>Subject: {preview(draft.subject)}</p><MarkdownContent>{preview(draft.bodyMarkdown)}</MarkdownContent></div></SectionCard>
      </div> : <EmptyState title="Select a template" description="Choose a message to edit and preview." />}
    </div>
  </div>;
}

function preview(value: string) {
  const examples: Record<string, string> = { candidateName: "Alex Perera", jobTitle: "Frontend Developer", companyName: "Acme Software", interviewDate: "Monday, 20 July 2026", interviewTime: "10:30 AM", interviewMode: "Online", meetingLink: "https://meet.example.com/interview", location: "Colombo Office", careersLink: "https://worknest.app/acme/careers" };
  return value.replace(/\{\{([a-zA-Z][a-zA-Z0-9]*)}}/g, (_, name: string) => examples[name] ?? "");
}
