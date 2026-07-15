import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileBarChart, Printer, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Pagination } from "@/components/common/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { getAllApplications, getAllJobPositions, getInterviews } from "@/modules/recruitment/services/recruitmentService";
import { usePageMeta } from "@/hooks/usePageMeta";

type ReportType = "jobs" | "applications" | "interviews" | "hiring";
type Row = Record<string, string | number | undefined>;

const REPORTS: Array<{ id: ReportType; label: string; description: string }> = [
  { id: "jobs", label: "Job Openings", description: "Opening status, publishing, deadline, and applicant volume" },
  { id: "applications", label: "Applications", description: "Candidates, roles, current stage, and application date" },
  { id: "interviews", label: "Interviews", description: "Scheduled interviews, mode, place, and status" },
  { id: "hiring", label: "Hiring", description: "Completed hires and employee handoff dates" },
];

export function RecruitmentReportsPage() {
  usePageMeta({ title: "Recruitment Reports", breadcrumb: ["Workspace", "Recruitment", "Reports"] });
  const [active, setActive] = useState<ReportType>("jobs");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const jobsQuery = useQuery({ queryKey: ["recruitment", "reports", "jobs"], queryFn: getAllJobPositions });
  const applicationsQuery = useQuery({ queryKey: ["recruitment", "reports", "applications"], queryFn: getAllApplications });
  const interviewsQuery = useQuery({ queryKey: ["recruitment", "reports", "interviews"], queryFn: () => getInterviews({ from: "2000-01-01T00:00:00", to: "2100-01-01T00:00:00" }) });
  const report = REPORTS.find((item) => item.id === active)!;

  const { columns, rows } = useMemo(() => buildReport(active, jobsQuery.data ?? [], applicationsQuery.data ?? [], interviewsQuery.data ?? []), [active, jobsQuery.data, applicationsQuery.data, interviewsQuery.data]);
  const filtered = useMemo(() => rows.filter((row) => {
    const matchesSearch = !search.trim() || Object.values(row).some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()));
    return matchesSearch && (!stage || String(row.Stage ?? row.Status ?? "") === stage);
  }), [rows, search, stage]);
  const pagination = useClientPagination(filtered, { storageKey: `recruitment-report-${active}`, resetKey: `${active}-${search}-${stage}-${filtered.length}` });
  const loading = jobsQuery.isLoading || applicationsQuery.isLoading || interviewsQuery.isLoading;
  const failed = jobsQuery.isError || applicationsQuery.isError || interviewsQuery.isError;

  function exportCsv() {
    const lines = [columns.map(csvCell).join(","), ...filtered.map((row) => columns.map((column) => csvCell(row[column] ?? "")).join(","))];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `recruitment-${active}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <div className="space-y-6">
    <PageHeader title="Recruitment Reports" description="Simple operational reports for openings, applications, interviews, and completed hires." actions={<><Button variant="outline" onClick={() => window.print()}><Printer size={16} />Print</Button><Button onClick={exportCsv} disabled={!filtered.length}><Download size={16} />Export CSV</Button></>} />
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 print:hidden">{REPORTS.map((item) => <button key={item.id} onClick={() => { setActive(item.id); setStage(""); }} className={`rounded-2xl border p-4 text-left transition ${active === item.id ? "border-purple-500 bg-purple-500/5 shadow-sm" : "hover:-translate-y-0.5 hover:shadow-sm"}`} style={active === item.id ? undefined : { borderColor: "var(--border-default)", background: "var(--bg-surface)" }}><p className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.label}</p><p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{item.description}</p></button>)}</div>
    <SectionCard title={`${report.label} Report`} subtitle={`${filtered.length} record${filtered.length === 1 ? "" : "s"} in the current report`} variant="table">
      <div className="grid gap-3 border-b p-5 md:grid-cols-[minmax(0,1fr)_14rem] print:hidden" style={{ borderColor: "var(--border-default)" }}><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--text-tertiary)" }} /><span className="sr-only">Search report</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this report" className="h-11 w-full rounded-xl border bg-transparent pl-10 pr-4 text-sm" style={{ borderColor: "var(--border-default)" }} /></label><AppSelect aria-label="Filter report status" value={stage} onChange={(event) => setStage(event.target.value)}><option value="">All statuses</option>{Array.from(new Set(rows.map((row) => String(row.Stage ?? row.Status ?? "")).filter(Boolean))).map((value) => <option key={value}>{value}</option>)}</AppSelect></div>
      {failed ? <div className="p-5"><ErrorBanner message="Could not load recruitment report data." onRetry={() => { void jobsQuery.refetch(); void applicationsQuery.refetch(); void interviewsQuery.refetch(); }} /></div>
        : loading ? <div>{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={columns.length || 5} />)}</div>
          : !filtered.length ? <EmptyState icon={<FileBarChart size={30} />} title="No report records" description="Change the search or status filter to see more data." />
            : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead style={{ background: "var(--bg-muted)" }}><tr>{columns.map((column) => <th key={column} className="px-5 py-3 font-semibold" style={{ color: "var(--text-secondary)" }}>{column}</th>)}</tr></thead><tbody className="divide-y" style={{ borderColor: "var(--border-default)" }}>{pagination.paginatedItems.map((row, index) => <tr key={`${active}-${index}`}>{columns.map((column) => <td key={column} className="px-5 py-4" style={{ color: "var(--text-primary)" }}>{row[column] || "—"}</td>)}</tr>)}</tbody></table></div>}
      {filtered.length ? <div className="p-4 print:hidden"><Pagination currentPage={pagination.currentPage} totalItems={filtered.length} pageSize={pagination.pageSize} onPageChange={pagination.setCurrentPage} onPageSizeChange={pagination.setPageSize} itemLabel="records" /></div> : null}
    </SectionCard>
  </div>;
}

function buildReport(type: ReportType, jobs: Awaited<ReturnType<typeof getAllJobPositions>>, applications: Awaited<ReturnType<typeof getAllApplications>>, interviews: Awaited<ReturnType<typeof getInterviews>>): { columns: string[]; rows: Row[] } {
  if (type === "jobs") return { columns: ["Job", "Department", "Status", "Publishing", "Deadline", "Applicants"], rows: jobs.map((item) => ({ Job: item.title, Department: item.department ?? "", Status: item.status === "OPEN" ? "Open" : "Closed", Publishing: item.published ? "Published" : "Draft", Deadline: date(item.expiresAt), Applicants: item.applicationCount })) };
  if (type === "interviews") return { columns: ["Candidate", "Job", "Date", "Mode", "Status", "Details"], rows: interviews.map((item) => ({ Candidate: item.candidate.fullName, Job: item.jobPosition.title, Date: dateTime(item.scheduledAt), Mode: item.mode === "REMOTE" ? "Online" : item.mode === "ONSITE" ? "Physical" : "Phone", Status: title(item.status), Details: item.meetingLink || item.location || "" })) };
  const source = type === "hiring" ? applications.filter((item) => item.status === "HIRED") : applications;
  return { columns: type === "hiring" ? ["Candidate", "Email", "Job", "Department", "Hired Date", "Employee ID"] : ["Candidate", "Email", "Job", "Department", "Stage", "Applied Date"], rows: source.map((item) => type === "hiring" ? ({ Candidate: item.candidate.fullName, Email: item.candidate.email, Job: item.jobPosition.title, Department: item.jobPosition.department ?? "", "Hired Date": date(item.hiredAt), "Employee ID": item.hiredEmployeeId ?? "" }) : ({ Candidate: item.candidate.fullName, Email: item.candidate.email, Job: item.jobPosition.title, Department: item.jobPosition.department ?? "", Stage: item.status === "OFFERED" ? "Offer" : title(item.status), "Applied Date": date(item.appliedAt) })) };
}

function csvCell(value: string | number) { const text = String(value ?? ""); const safe = /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text; return `"${safe.replaceAll('"', '""')}"`; }
function title(value: string) { return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function date(value?: string) { if (!value) return ""; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(); }
function dateTime(value?: string) { if (!value) return ""; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString(); }
