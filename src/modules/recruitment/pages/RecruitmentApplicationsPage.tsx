import { useState } from "react";
import { Download, FileSearch, Users } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Pagination } from "@/components/common/Pagination";
import { RecruitmentStatusBadge } from "@/modules/recruitment/components/RecruitmentStatusBadge";
import { useRecruitmentApplicationsQuery, useRecruitmentJobsQuery } from "@/modules/recruitment/hooks/useRecruitment";
import type { RecruitmentStage } from "@/modules/recruitment/types";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SearchField } from "@/components/common/SearchField";

const STAGES: Array<{ value: RecruitmentStage; label: string }> = [
  { value: "APPLIED", label: "Applied" }, { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" }, { value: "OFFERED", label: "Offer" },
  { value: "HIRED", label: "Hired" }, { value: "REJECTED", label: "Rejected" },
];

export function RecruitmentApplicationsPage() {
  usePageMeta({ title: "Applications", breadcrumb: ["Workspace", "Recruitment", "Applications"] });
  const { tenantSlug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RecruitmentStage | "">((searchParams.get("status") as RecruitmentStage) || "");
  const [jobPositionId, setJobPositionId] = useState(searchParams.get("jobPositionId") ?? "");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const applicationsQuery = useRecruitmentApplicationsQuery({ search, status, jobPositionId: jobPositionId || undefined, page: page - 1, size: pageSize, sortBy: "appliedAt", sortDir: "desc" });
  const jobsQuery = useRecruitmentJobsQuery({ size: 100 });
  const applications = applicationsQuery.data?.items ?? [];

  function resetPage() { setPage(1); }

  return <div className="space-y-6">
    <PageHeader title="Applications" description="Review every applicant in one clean list, newest first. Open an application for notes, interviews, email, and hiring." />
    <SectionCard variant="table">
      <div className="grid gap-3 border-b p-5 md:grid-cols-[minmax(0,1fr)_13rem_15rem]" style={{ borderColor: "var(--border-default)" }}>
        <SearchField label="Search applications" value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Search candidate, email, or job" />
        <label className="space-y-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}><span className="sr-only">Stage</span><AppSelect aria-label="Filter by stage" value={status} onChange={(event) => { setStatus(event.target.value as RecruitmentStage | ""); resetPage(); }}><option value="">All stages</option>{STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</AppSelect></label>
        <label className="space-y-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}><span className="sr-only">Job opening</span><AppSelect aria-label="Filter by job opening" value={jobPositionId} onChange={(event) => { setJobPositionId(event.target.value); resetPage(); }}><option value="">All job openings</option>{(jobsQuery.data?.items ?? []).map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</AppSelect></label>
      </div>

      {applicationsQuery.isError ? <div className="p-5"><ErrorBanner message="Could not load applications." onRetry={() => void applicationsQuery.refetch()} /></div>
        : applicationsQuery.isLoading ? <div>{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={6} />)}</div>
        : applications.length === 0 ? <EmptyState icon={<Users size={30} />} title="No applications found" description={search || status || jobPositionId ? "Clear or change the filters to see more applications." : "Applications submitted through your careers page will appear here."} />
        : <div className="overflow-x-auto"><table className="worknest-data-table w-full min-w-[820px] text-left text-sm">
          <thead style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}><tr><th className="px-5 py-3 font-semibold">Candidate</th><th className="px-5 py-3 font-semibold">Job opening</th><th className="px-5 py-3 font-semibold">Applied</th><th className="px-5 py-3 font-semibold">Stage</th><th className="px-5 py-3 font-semibold">Resume</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>{applications.map((item) => <tr key={item.id} className="transition hover:bg-purple-500/[0.03]">
            <td className="px-5 py-4"><p className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.candidate.fullName}</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{item.candidate.email}</p></td>
            <td className="px-5 py-4"><p style={{ color: "var(--text-primary)" }}>{item.jobPosition.title}</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>{item.jobPosition.department ?? "No department"}</p></td>
            <td className="whitespace-nowrap px-5 py-4" style={{ color: "var(--text-secondary)" }}>{formatDate(item.appliedAt)}</td>
            <td className="px-5 py-4"><RecruitmentStatusBadge value={item.status} /></td>
            <td className="px-5 py-4">{item.candidate.resumeFileUrl ? <a href={item.candidate.resumeFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-purple-600 hover:underline"><Download size={14} />CV</a> : <span style={{ color: "var(--text-tertiary)" }}>Not attached</span>}</td>
            <td className="px-5 py-4 text-right"><Button size="sm" variant="outline" to={tenantRoutes.recruitmentApplication(item.id, tenantSlug)}><FileSearch size={14} />Review</Button></td>
          </tr>)}</tbody>
        </table></div>}
      {(applicationsQuery.data?.totalElements ?? 0) > 0 ? <div className="p-4"><Pagination currentPage={page} totalItems={applicationsQuery.data?.totalElements ?? 0} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} itemLabel="applications" /></div> : null}
    </SectionCard>
  </div>;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
