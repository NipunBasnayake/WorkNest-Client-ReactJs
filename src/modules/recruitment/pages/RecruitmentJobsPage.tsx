import { useEffect, useMemo, useState } from "react";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { TextareaField } from "@/components/common/TextareaField";
import { AppSelect } from "@/components/common/AppSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/constants/permissions";
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
};

export function RecruitmentJobsPage() {
  usePageMeta({ title: "Recruitment Jobs", breadcrumb: ["Workspace", "Recruitment", "Jobs"] });
  const jobsQuery = useRecruitmentJobsQuery();
  const { hasPermission } = usePermission();
  const canManageRecruitment = hasPermission(PERMISSIONS.RECRUITMENT_MANAGE);
  const [form, setForm] = useState<RecruitmentJobFormValues>(EMPTY_FORM);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentJobPosition | null>(null);

  useEffect(() => {
    if (!editingJobId) return;
  }, [editingJobId]);

  const jobs = jobsQuery.data?.items ?? [];
  const selectedJob = useMemo(() => jobs.find((job) => job.id === editingJobId) ?? null, [editingJobId, jobs]);

  useEffect(() => {
    if (!selectedJob) return;
    setForm({
      title: selectedJob.title,
      department: selectedJob.department ?? "",
      description: selectedJob.description ?? "",
      employmentType: selectedJob.employmentType ?? "FULL_TIME",
      location: selectedJob.location ?? "",
      openings: selectedJob.openings ?? 1,
      status: selectedJob.status ?? "OPEN",
      published: Boolean(selectedJob.published),
    });
  }, [selectedJob]);

  async function handleSubmit(event: React.FormEvent) {
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
      setFeedback("Job deleted successfully.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not delete job position."));
    } finally {
      setSaving(false);
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
        description="Create and manage tenant-scoped job positions."
        actions={canManageRecruitment ? (
          <Button variant="outline" onClick={startCreate}>
            <PlusCircle size={16} />
            New Job
          </Button>
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
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>{editingJobId ? "Update" : "Create"}</Button>
              {editingJobId ? <Button type="button" variant="outline" onClick={startCreate}>Cancel</Button> : null}
            </div>
            </form>
          </SectionCard>
        ) : (
          <SectionCard title="Recruitment access" subtitle="Job management is available to HR and tenant administrators.">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You can review job openings, but you do not have permission to create, edit, or delete recruitment jobs.
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
              {jobs.map((job) => (
                <div key={job.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</h3>
                      {job.status ? <RecruitmentStatusBadge value={job.status} /> : null}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {job.department || "General"} · {job.location || "Remote"} · {job.applicationCount ?? 0} application{(job.applicationCount ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  {canManageRecruitment ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingJobId(job.id)}>
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(job)}>
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
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
