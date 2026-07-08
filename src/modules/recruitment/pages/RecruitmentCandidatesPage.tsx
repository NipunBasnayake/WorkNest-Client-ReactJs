import { useEffect, useState } from "react";
import { Paperclip, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { TextareaField } from "@/components/common/TextareaField";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/constants/permissions";
import { useRecruitmentCandidatesQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { createCandidate, uploadCandidateResume } from "@/modules/recruitment/services/recruitmentService";
import type { RecruitmentCandidate, RecruitmentCandidateFormValues } from "@/modules/recruitment/types";
import { getErrorMessage } from "@/utils/errorHandler";

const EMPTY_FORM: RecruitmentCandidateFormValues = {
  fullName: "",
  email: "",
  phone: "",
  currentTitle: "",
  yearsOfExperience: "",
  source: "",
  summary: "",
};

export function RecruitmentCandidatesPage() {
  usePageMeta({ title: "Recruitment Candidates", breadcrumb: ["Workspace", "Recruitment", "Candidates"] });
  const candidatesQuery = useRecruitmentCandidatesQuery();
  const { hasPermission } = usePermission();
  const canManageRecruitment = hasPermission(PERMISSIONS.RECRUITMENT_MANAGE);
  const [form, setForm] = useState<RecruitmentCandidateFormValues>(EMPTY_FORM);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruitmentCandidate | null>(null);

  useEffect(() => {
    if (!selectedCandidate) return;
    setForm({
      fullName: selectedCandidate.fullName,
      email: selectedCandidate.email,
      phone: selectedCandidate.phone ?? "",
      currentTitle: selectedCandidate.currentTitle ?? "",
      yearsOfExperience: selectedCandidate.yearsOfExperience ? String(selectedCandidate.yearsOfExperience) : "",
      source: selectedCandidate.source ?? "",
      summary: selectedCandidate.summary ?? "",
    });
  }, [selectedCandidate]);

  const candidates = candidatesQuery.data?.items ?? [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canManageRecruitment) {
      setFeedback("You do not have permission to manage candidates.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await createCandidate(form);
      if (resumeFile) {
        await uploadCandidateResume(saved.id, resumeFile);
      }
      await candidatesQuery.refetch();
      setSelectedCandidate(null);
      setResumeFile(null);
      setForm(EMPTY_FORM);
      setFeedback("Candidate saved successfully.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not save candidate."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Maintain a tenant-specific candidate pool with resume uploads and recruiter notes."
        actions={canManageRecruitment ? <Button onClick={() => setSelectedCandidate(null)}><PlusCircle size={16} />New Candidate</Button> : undefined}
      />

      {feedback ? <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>{feedback}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {canManageRecruitment ? (
          <SectionCard title="Candidate form" subtitle="Store candidate details and optionally upload a resume.">
            <form className="space-y-4" onSubmit={handleSubmit}>
            <Input id="candidate-name" label="Full name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} required />
            <Input id="candidate-email" label="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
            <Input id="candidate-phone" label="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="candidate-title" label="Current title" value={form.currentTitle} onChange={(event) => setForm((prev) => ({ ...prev, currentTitle: event.target.value }))} />
              <Input id="candidate-exp" label="Years of experience" type="number" min={0} value={form.yearsOfExperience} onChange={(event) => setForm((prev) => ({ ...prev, yearsOfExperience: event.target.value }))} />
            </div>
            <Input id="candidate-source" label="Source" value={form.source} onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))} />
            <TextareaField id="candidate-summary" label="Summary" rows={5} value={form.summary} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} />
            <div>
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Resume</label>
              <input className="mt-2 block w-full text-sm" type="file" accept=".pdf,image/*" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" loading={saving}>
              <Paperclip size={16} />
              Save Candidate
            </Button>
            </form>
          </SectionCard>
        ) : (
          <SectionCard title="Recruitment access" subtitle="Candidate management is available to HR and tenant administrators.">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You can review candidates, but you do not have permission to create candidates or upload resumes.
            </p>
          </SectionCard>
        )}

        <SectionCard title="Candidate pool" subtitle="Recently added talent and attached resumes." variant="table">
          {candidatesQuery.isError ? (
            <ErrorBanner message="Failed to load candidates." onRetry={() => void candidatesQuery.refetch()} />
          ) : candidatesQuery.isLoading ? (
            <div>{Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} cols={4} />)}</div>
          ) : candidates.length === 0 ? (
            <EmptyState title="No candidates yet" description="Add a candidate to start building a hiring pipeline." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => {
                    if (canManageRecruitment) setSelectedCandidate(candidate);
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[var(--bg-muted)]"
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{candidate.fullName}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{candidate.email}</p>
                  </div>
                  <div className="text-right text-xs" style={{ color: "var(--text-secondary)" }}>
                    <p>{candidate.currentTitle || "No title"}</p>
                    <p>{candidate.resumeFileName ? "Resume attached" : "No resume"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
