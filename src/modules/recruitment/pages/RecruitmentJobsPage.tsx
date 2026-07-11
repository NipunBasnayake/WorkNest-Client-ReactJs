import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Archive, CheckCircle2, Copy, ExternalLink, Link2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { TextareaField } from "@/components/common/TextareaField";
import { AppSelect } from "@/components/common/AppSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/useToast";
import { PERMISSIONS } from "@/constants/permissions";
import { PublicShareMenu } from "@/modules/careers/components/PublicShareMenu";
import { buildCareersUrl, buildVacancyUrl, copyPublicUrl, openPublicUrl } from "@/modules/careers/share";
import { useRecruitmentJobsQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { RecruitmentStatusBadge } from "@/modules/recruitment/components/RecruitmentStatusBadge";
import { createJobPosition, deleteJobPosition, updateJobPosition } from "@/modules/recruitment/services/recruitmentService";
import type { RecruitmentJobFormValues, RecruitmentJobPosition } from "@/modules/recruitment/types";
import { getErrorMessage } from "@/utils/errorHandler";

const EMPTY_FORM: RecruitmentJobFormValues = {
  title: "",
  department: "",
  description: "",
  employmentType: "FULL_TIME",
  location: "",
  openings: 1,
  status: "OPEN",
  published: true,
  visibleToExternalApplicants: true,
};

export function RecruitmentJobsPage() {
  usePageMeta({ title: "Recruitment Jobs", breadcrumb: ["Workspace", "Recruitment", "Jobs"] });
  const queryClient = useQueryClient();
  const { tenantSlug = "" } = useParams();
  const toast = useToast();
  const jobsQuery = useRecruitmentJobsQuery();
  const { hasPermission } = usePermission();
  const canManageRecruitment = hasPermission(PERMISSIONS.RECRUITMENT_MANAGE);
  const careersUrl = tenantSlug ? buildCareersUrl(tenantSlug) : "";
  const [form, setForm] = useState<RecruitmentJobFormValues>(EMPTY_FORM);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentJobPosition | null>(null);

  const jobs = jobsQuery.data?.items ?? [];
  const selectedJob = useMemo(() => jobs.find((job) => job.id === editingJobId) ?? null, [editingJobId, jobs]);

  useEffect(() => {
    if (!selectedJob) return;
    setForm(toJobFormValues(selectedJob));
  }, [selectedJob]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManageRecruitment) {
      setFeedback("You do not have permission to manage recruitment jobs.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      if (editingJobId) {
        await updateJobPosition(editingJobId, form);
        setFeedback("Job updated successfully.");
      } else {
        await createJobPosition(form);
        setFeedback("Job created successfully.");
      }
      setEditingJobId(null);
      setForm(EMPTY_FORM);
      await jobsQuery.refetch();
      await invalidateWorkflowQueries(queryClient, ["recruitment"]);
    } catch (error) {
      setFeedback(getErrorMessage(error, "Failed to save job position."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (!canManageRecruitment) {
      setFeedback("You do not have permission to delete recruitment jobs.");
      return;
    }
    setSaving(true);
    try {
      await deleteJobPosition(deleteTarget.id);
      setDeleteTarget(null);
      await jobsQuery.refetch();
      await invalidateWorkflowQueries(queryClient, ["recruitment"]);
      setFeedback("Job deleted successfully.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not delete job position."));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle(job: RecruitmentJobPosition, published: boolean) {
    if (!canManageRecruitment) {
      setFeedback("You do not have permission to manage recruitment jobs.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await updateJobPosition(job.id, toJobFormValues(job, { published }));
      await jobsQuery.refetch();
      await invalidateWorkflowQueries(queryClient, ["recruitment"]);
      setFeedback(published ? "Vacancy published successfully." : "Vacancy unpublished successfully.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not update vacancy publishing."));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(job: RecruitmentJobPosition) {
    if (!canManageRecruitment) {
      setFeedback("You do not have permission to manage recruitment jobs.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await updateJobPosition(job.id, toJobFormValues(job, { status: "CLOSED", published: false }));
      await jobsQuery.refetch();
      await invalidateWorkflowQueries(queryClient, ["recruitment"]);
      setFeedback("Vacancy archived successfully.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not archive vacancy."));
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyCareers() {
    if (!careersUrl) return;
    const outcome = await copyPublicUrl(careersUrl);
    if (outcome === "copied") {
      toast.success({ title: "Careers page copied" });
    } else if (outcome === "prompt") {
      toast.info({ title: "Copy the public link", description: "Use the selectable URL dialog to copy the careers page." });
    }
  }

  async function handleCopyVacancy(url: string) {
    const outcome = await copyPublicUrl(url);
    if (outcome === "copied") {
      toast.success({ title: "Vacancy link copied" });
    } else if (outcome === "prompt") {
      toast.info({ title: "Copy the public link", description: "Use the selectable URL dialog to copy the vacancy link." });
    }
  }

  function startCreate() {
    setEditingJobId(null);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Openings"
        description="Create, publish, and share tenant-scoped vacancies."
        actions={canManageRecruitment ? (
          <>
            <Button variant="outline" onClick={() => void handleCopyCareers()} title="Copy Careers Page" aria-label="Copy careers page URL">
              <Link2 size={16} />
              Copy Careers
            </Button>
            <Button variant="outline" onClick={startCreate}>
              <PlusCircle size={16} />
              New Job
            </Button>
          </>
        ) : undefined}
      />

      {feedback ? <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>{feedback}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {canManageRecruitment ? (
          <SectionCard title={editingJobId ? "Edit job" : "Create job"} subtitle="Use this form to publish or update a vacancy.">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input id="job-title" label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <Input id="job-department" label="Department" value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} />
              <TextareaField id="job-description" label="Description" rows={5} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              <div className="grid gap-4 sm:grid-cols-2">
                <AppSelect value={form.employmentType} onChange={(event) => setForm((prev) => ({ ...prev, employmentType: event.target.value as RecruitmentJobFormValues["employmentType"] }))}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </AppSelect>
                <Input id="job-location" label="Location" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="job-openings" label="Openings" type="number" min={1} value={form.openings} onChange={(event) => setForm((prev) => ({ ...prev, openings: Number(event.target.value) }))} />
                <AppSelect value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as RecruitmentJobFormValues["status"] }))}>
                  <option value="OPEN">Open</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CLOSED">Closed</option>
                </AppSelect>
              </div>
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={form.published} onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))} />
                Published
              </label>

              {selectedJob ? (
                <PublicLinkPanel
                  job={selectedJob}
                  tenantSlug={tenantSlug}
                  careersUrl={careersUrl}
                  onCopyVacancy={handleCopyVacancy}
                />
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" loading={saving}>{editingJobId ? "Update" : "Create"}</Button>
                {editingJobId ? <Button type="button" variant="outline" onClick={startCreate}>Cancel</Button> : null}
              </div>
            </form>
          </SectionCard>
        ) : (
          <SectionCard title="Recruitment access" subtitle="Job management is available to HR and tenant administrators.">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You can review job openings, but you do not have permission to create, edit, publish, share, archive, or delete recruitment jobs.
            </p>
          </SectionCard>
        )}

        <SectionCard title="Jobs" subtitle="Open positions and their application counts." variant="table">
          {jobsQuery.isError ? (
            <ErrorBanner message="Failed to load jobs." onRetry={() => void jobsQuery.refetch()} />
          ) : jobsQuery.isLoading ? (
            <div>{Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} cols={4} />)}</div>
          ) : jobs.length === 0 ? (
            <EmptyState title="No job openings" description="Create the first job opening to start building the pipeline." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
              {jobs.map((job) => {
                const vacancyUrl = tenantSlug && job.slug && isShareableJob(job) ? buildVacancyUrl(tenantSlug, job.slug) : null;
                return (
                  <div key={job.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</h3>
                        {job.status ? <RecruitmentStatusBadge value={job.status} /> : null}
                        <JobPublicationBadges job={job} />
                      </div>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {job.department || "General"} - {job.location || "Remote"} - {job.applicationCount ?? 0} application{(job.applicationCount ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    {canManageRecruitment ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingJobId(job.id)}>
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handlePublishToggle(job, !job.published)}
                          disabled={saving}
                        >
                          <CheckCircle2 size={14} />
                          {job.published ? "Unpublish" : "Publish"}
                        </Button>
                        {vacancyUrl ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleCopyVacancy(vacancyUrl)}
                              title="Copy Public Link"
                              aria-label={`Copy public link for ${job.title}`}
                            >
                              <Copy size={14} />
                              Copy Link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPublicUrl(vacancyUrl)}
                              title="Open Public Vacancy"
                              aria-label={`Open public vacancy for ${job.title}`}
                            >
                              <ExternalLink size={14} />
                              View Public
                            </Button>
                            <PublicShareMenu
                              careersUrl={careersUrl}
                              vacancyUrl={vacancyUrl}
                              vacancyTitle={job.title}
                              companyName={tenantSlug}
                              size="sm"
                            />
                          </>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={() => void handleArchive(job)} disabled={saving}>
                          <Archive size={14} />
                          Archive
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(job)}>
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete job"
        description={deleteTarget ? `Delete ${deleteTarget.title}? This removes the vacancy from the recruitment workspace.` : ""}
        confirmLabel="Delete"
        loading={saving}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function PublicLinkPanel({
  job,
  tenantSlug,
  careersUrl,
  onCopyVacancy,
}: {
  job: RecruitmentJobPosition;
  tenantSlug: string;
  careersUrl: string;
  onCopyVacancy: (url: string) => Promise<void>;
}) {
  const vacancyUrl = tenantSlug && job.slug && isShareableJob(job) ? buildVacancyUrl(tenantSlug, job.slug) : null;

  return (
    <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Public Link</h3>
        <JobPublicationBadges job={job} />
      </div>
      {vacancyUrl ? (
        <>
          <input
            readOnly
            value={vacancyUrl}
            className="w-full rounded-xl border bg-[var(--bg-surface)] px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            aria-label="Public vacancy URL"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void onCopyVacancy(vacancyUrl)} title="Copy Public Link" aria-label="Copy public vacancy link">
              <Copy size={14} />
              Copy
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => openPublicUrl(vacancyUrl)} title="Open Public Vacancy" aria-label="Open public vacancy">
              <ExternalLink size={14} />
              Open
            </Button>
            <PublicShareMenu careersUrl={careersUrl} vacancyUrl={vacancyUrl} vacancyTitle={job.title} companyName={tenantSlug} size="sm" />
          </div>
        </>
      ) : (
        <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          Public links are available only for published, open, externally visible, non-expired vacancies.
        </p>
      )}
    </div>
  );
}

function JobPublicationBadges({ job }: { job: RecruitmentJobPosition }) {
  const badges: Array<{ label: string; variant: "success" | "neutral" | "info" | "danger" | "warning" }> = [];
  const expired = isExpired(job);
  const external = job.visibleToExternalApplicants ?? true;

  if (job.published) {
    badges.push({ label: "Published", variant: "success" });
  } else {
    badges.push({ label: "Draft", variant: "neutral" });
  }
  if (!external) {
    badges.push({ label: "Internal", variant: "info" });
  }
  if (job.status === "CLOSED") {
    badges.push({ label: "Closed", variant: "danger" });
  }
  if (expired) {
    badges.push({ label: "Expired", variant: "warning" });
  }

  return (
    <>
      {badges.map((badge) => (
        <Badge key={badge.label} variant={badge.variant}>{badge.label}</Badge>
      ))}
    </>
  );
}

function toJobFormValues(
  job: RecruitmentJobPosition,
  overrides: Partial<RecruitmentJobFormValues> = {}
): RecruitmentJobFormValues {
  return {
    title: job.title,
    department: job.department ?? "",
    description: job.description ?? "",
    employmentType: job.employmentType ?? "FULL_TIME",
    location: job.location ?? "",
    openings: job.openings ?? 1,
    status: job.status ?? "OPEN",
    published: Boolean(job.published),
    visibleToExternalApplicants: job.visibleToExternalApplicants ?? true,
    expiresAt: job.expiresAt,
    ...overrides,
  };
}

function isShareableJob(job: RecruitmentJobPosition) {
  return Boolean(
    job.published
    && job.slug
    && job.status === "OPEN"
    && (job.visibleToExternalApplicants ?? true)
    && !isExpired(job)
  );
}

function isExpired(job: RecruitmentJobPosition) {
  if (!job.expiresAt) return false;
  const expiry = new Date(job.expiresAt);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() <= Date.now();
}
