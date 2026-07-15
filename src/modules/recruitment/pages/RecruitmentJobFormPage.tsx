import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, Save, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { AppSelect } from "@/components/common/AppSelect";
import { ErrorBanner } from "@/components/common/AppUI";
import { LoadingSkeleton } from "@/components/common/AsyncStates";
import { MarkdownEditor } from "@/modules/recruitment/components/MarkdownEditor";
import { useRecruitmentJobQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { createJobPosition, runJobAction, updateJobPosition } from "@/modules/recruitment/services/recruitmentService";
import type { RecruitmentJobFormValues } from "@/modules/recruitment/types";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";

const DEFAULT_DESCRIPTION = `# About the role

Tell candidates what makes this opportunity meaningful and what they will work on.

## What you will do

- Add the main responsibilities
- Explain the impact of the role
- Describe how the team works

## What we are looking for

- Add the essential skills and experience
- Keep requirements practical and inclusive

## What we offer

- Add benefits, learning opportunities, and ways of working
`;

const EMPTY: RecruitmentJobFormValues = { title: "", department: "", employmentType: "FULL_TIME", location: "", experience: "", expiresAt: "", openings: 1, description: DEFAULT_DESCRIPTION };

export function RecruitmentJobFormPage() {
  const { tenantSlug = "", jobId } = useParams();
  const editing = Boolean(jobId);
  usePageMeta({ title: editing ? "Edit Job Opening" : "New Job Opening", breadcrumb: ["Workspace", "Recruitment", "Job Openings", editing ? "Edit" : "New"] });
  const jobQuery = useRecruitmentJobQuery(jobId);
  const [form, setForm] = useState<RecruitmentJobFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (!jobQuery.data) return;
    setForm({ title: jobQuery.data.title, department: jobQuery.data.department ?? "", employmentType: jobQuery.data.employmentType ?? "FULL_TIME", location: jobQuery.data.location ?? "", experience: jobQuery.data.experience ?? "", expiresAt: jobQuery.data.expiresAt?.slice(0, 10) ?? "", openings: jobQuery.data.openings ?? 1, description: jobQuery.data.description ?? "" });
  }, [jobQuery.data]);

  async function save(publish: boolean) {
    setError(null);
    if (!form.title.trim() || !form.department.trim() || !form.description.trim()) {
      setError("Title, department, and job description are required.");
      return;
    }
    setSaving(true);
    try {
      const saved = editing && jobQuery.data ? await updateJobPosition(jobId!, form, jobQuery.data) : await createJobPosition(form);
      if (publish && !saved.published) await runJobAction(saved.id, "publish");
      await queryClient.invalidateQueries({ queryKey: ["recruitment"] });
      toast.success({ title: publish ? "Job opening published" : "Draft saved" });
      navigate(tenantRoutes.recruitmentJobs(tenantSlug));
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not save the job opening."));
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void save(false); }

  if (editing && jobQuery.isLoading) return <LoadingSkeleton lines={9} />;
  if (editing && jobQuery.isError) return <ErrorBanner message="Could not load this job opening." onRetry={() => void jobQuery.refetch()} />;

  return <form className="space-y-6" onSubmit={submit}>
    <PageHeader
      title={editing ? `Edit ${jobQuery.data?.title ?? "Job Opening"}` : "Create Job Opening"}
      description="Keep the essentials structured and write the full job page in one flexible Markdown document."
      backButton={<Button variant="ghost" size="sm" to={tenantRoutes.recruitmentJobs(tenantSlug)}><ArrowLeft size={15} />Back to jobs</Button>}
      actions={<><Button type="submit" variant="outline" loading={saving}><Save size={16} />Save Draft</Button><Button type="button" loading={saving} onClick={() => void save(true)}><Send size={16} />Save & Publish</Button></>}
    />
    {error ? <ErrorBanner message={error} /> : null}
    <SectionCard title="Job details" subtitle="The information candidates use to find and understand the opening.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2"><Input id="job-title" label="Job title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Senior Frontend Developer" required /></div>
        <Input id="job-department" label="Department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Engineering" required />
        <label className="space-y-1.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}><span>Employment type</span><AppSelect value={form.employmentType} onChange={(event) => setForm((current) => ({ ...current, employmentType: event.target.value as RecruitmentJobFormValues["employmentType"] }))}><option value="FULL_TIME">Full time</option><option value="PART_TIME">Part time</option><option value="CONTRACT">Contract</option><option value="INTERN">Internship</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option></AppSelect></label>
        <Input id="job-location" label="Location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Colombo or Remote" />
        <Input id="job-experience" label="Experience" value={form.experience} onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))} placeholder="3+ years" />
        <Input id="job-deadline" label="Application deadline" type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
        <Input id="job-openings" label="Openings" type="number" min={1} value={form.openings} onChange={(event) => setForm((current) => ({ ...current, openings: Math.max(1, Number(event.target.value)) }))} />
      </div>
    </SectionCard>
    <SectionCard title="Job page" subtitle="The preview uses the same renderer as the public careers site." action={editing ? <Button variant="outline" size="sm" to={tenantRoutes.recruitmentJobPreview(jobId!, tenantSlug)}><Eye size={15} />Full preview</Button> : undefined}>
      <MarkdownEditor value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} error={!form.description.trim() && error ? "Write a job description before saving." : undefined} />
    </SectionCard>
  </form>;
}
