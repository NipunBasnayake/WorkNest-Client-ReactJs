import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, BriefcaseBusiness, Copy, ExternalLink, FilePenLine, Link2, MoreHorizontal, Plus, Send, Undo2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Pagination } from "@/components/common/Pagination";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/useToast";
import { PERMISSIONS } from "@/constants/permissions";
import { useRecruitmentJobsQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { deleteJobPosition, runJobAction } from "@/modules/recruitment/services/recruitmentService";
import type { RecruitmentJobPosition } from "@/modules/recruitment/types";
import { buildVacancyUrl, copyPublicUrl, openPublicUrl } from "@/modules/careers/share";
import { buildCareersUrl } from "@/modules/careers/share";
import { PublicShareMenu } from "@/modules/careers/components/PublicShareMenu";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { getErrorMessage } from "@/utils/errorHandler";
import { SearchField } from "@/components/common/SearchField";

type Action = "publish" | "unpublish" | "close" | "reopen" | "duplicate";
const MENU_ACTION = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-primary-500/5";

export function RecruitmentJobsPage() {
  usePageMeta({ title: "Job Openings", breadcrumb: ["Workspace", "Recruitment", "Job Openings"] });
  const { tenantSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.RECRUITMENT_MANAGE);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentJobPosition | null>(null);
  const jobsQuery = useRecruitmentJobsQuery({ search, page: page - 1, size: pageSize });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["recruitment"] });
  }

  async function act(job: RecruitmentJobPosition, action: Action) {
    setBusyId(job.id);
    try {
      const result = await runJobAction(job.id, action);
      await refresh();
      const actionTitles = { publish: "Job published", unpublish: "Job unpublished", close: "Job closed", reopen: "Job reopened", duplicate: "Draft duplicated" } as const;
      toast.success({ title: actionTitles[action], description: action === "duplicate" ? `${result.title} is ready to edit.` : undefined });
    } catch (error) {
      toast.error({ title: "Job action failed", description: getErrorMessage(error, "Please try again.") });
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteJobPosition(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
      toast.success({ title: "Job removed" });
    } catch (error) {
      toast.error({ title: "Could not delete job", description: getErrorMessage(error, "Please try again.") });
    } finally {
      setBusyId(null);
    }
  }

  async function copyLink(job: RecruitmentJobPosition) {
    if (!job.slug) return;
    await copyPublicUrl(buildVacancyUrl(tenantSlug, job.slug));
    toast.success({ title: "Public link copied" });
  }

  const jobs = jobsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Openings"
        description="Create polished job pages, publish in one click, and review applications by opening."
        actions={canManage ? <Button to={tenantRoutes.recruitmentJobNew(tenantSlug)}><Plus size={16} />New Job Opening</Button> : undefined}
      />

      <SectionCard variant="table">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-default)" }}>
          <SearchField label="Search job openings" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by title or department" className="w-full sm:max-w-md" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{jobsQuery.data?.totalElements ?? 0} job opening{jobsQuery.data?.totalElements === 1 ? "" : "s"}</p>
        </div>

        {jobsQuery.isError ? <div className="p-5"><ErrorBanner message="Could not load job openings." onRetry={() => void jobsQuery.refetch()} /></div>
          : jobsQuery.isLoading ? <div>{Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} cols={5} />)}</div>
          : jobs.length === 0 ? <div className="p-8"><EmptyState icon={<BriefcaseBusiness size={30} />} title={search ? "No matching job openings" : "Create your first job opening"} description={search ? "Try a different title or department." : "Write the role once in Markdown, preview it, and publish when it is ready."} action={canManage && !search ? <Button to={tenantRoutes.recruitmentJobNew(tenantSlug)}><Plus size={16} />Create Job Opening</Button> : undefined} /></div>
          : <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
            {jobs.map((job) => <JobRow key={job.id} job={job} tenantSlug={tenantSlug} canManage={canManage} busy={busyId === job.id} onAction={act} onCopy={copyLink} onDelete={setDeleteTarget} />)}
          </div>}

        {(jobsQuery.data?.totalElements ?? 0) > 0 ? <div className="p-4"><Pagination currentPage={page} totalItems={jobsQuery.data?.totalElements ?? 0} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} itemLabel="jobs" /></div> : null}
      </SectionCard>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete job opening?" description={deleteTarget ? `${deleteTarget.title} will be removed from recruitment. Existing applications remain preserved.` : ""} confirmLabel="Delete" loading={Boolean(busyId)} onConfirm={() => void remove()} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function JobRow({ job, tenantSlug, canManage, busy, onAction, onCopy, onDelete }: { job: RecruitmentJobPosition; tenantSlug: string; canManage: boolean; busy: boolean; onAction: (job: RecruitmentJobPosition, action: Action) => Promise<void>; onCopy: (job: RecruitmentJobPosition) => Promise<void>; onDelete: (job: RecruitmentJobPosition) => void }) {
  const publicUrl = job.slug ? buildVacancyUrl(tenantSlug, job.slug) : "";
  return (
    <article className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</h2>
          <Badge variant={job.status === "OPEN" ? "success" : "neutral"}>{job.status === "OPEN" ? "Open" : "Closed"}</Badge>
          <Badge variant={job.published ? "info" : "neutral"}>{job.published ? "Published" : "Draft"}</Badge>
        </div>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>{[job.department, job.employmentType?.replaceAll("_", " "), job.location].filter(Boolean).join(" · ") || "Job details not completed"}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <span>{job.applicationCount} applicant{job.applicationCount === 1 ? "" : "s"}</span>
          <span>Created {formatDate(job.createdAt)}</span>
          {job.publishedAt ? <span>Published {formatDate(job.publishedAt)}</span> : null}
          {job.expiresAt ? <span>Deadline {formatDate(job.expiresAt)}</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <Button size="sm" variant="outline" to={tenantRoutes.recruitmentJobApplications(job.id, tenantSlug)}>{job.applicationCount} Applications</Button>
        <Button size="sm" variant="outline" to={tenantRoutes.recruitmentJobPreview(job.id, tenantSlug)}><ExternalLink size={14} />Preview</Button>
        {job.published && publicUrl ? <PublicShareMenu careersUrl={buildCareersUrl(tenantSlug)} vacancyUrl={publicUrl} vacancyTitle={job.title} companyName={tenantSlug} size="sm" /> : null}
        {canManage ? <>
          <Button size="sm" variant="outline" to={tenantRoutes.recruitmentJobEdit(job.id, tenantSlug)}><FilePenLine size={14} />Edit</Button>
          {job.status === "CLOSED" ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void onAction(job, "reopen")}><Undo2 size={14} />Reopen</Button>
            : job.published ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void onAction(job, "unpublish")}><Archive size={14} />Unpublish</Button>
              : <Button size="sm" disabled={busy} onClick={() => void onAction(job, "publish")}><Send size={14} />Publish</Button>}
          <details className="relative">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border" style={{ borderColor: "var(--border-default)" }} aria-label="More job actions"><MoreHorizontal size={16} /></summary>
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border p-1.5 shadow-xl" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
              {job.published && publicUrl ? <button className={MENU_ACTION} onClick={() => openPublicUrl(publicUrl)}><ExternalLink size={14} />View public page</button> : null}
              {job.published && publicUrl ? <button className={MENU_ACTION} onClick={() => void onCopy(job)}><Link2 size={14} />Copy public link</button> : null}
              <button className={MENU_ACTION} onClick={() => void onAction(job, "duplicate")}><Copy size={14} />Duplicate</button>
              {job.status === "OPEN" ? <button className={MENU_ACTION} onClick={() => void onAction(job, "close")}><Archive size={14} />Close</button> : null}
              <button className={`${MENU_ACTION} text-red-600`} onClick={() => onDelete(job)}>Delete</button>
            </div>
          </details>
        </> : null}
      </div>
    </article>
  );
}

function formatDate(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
