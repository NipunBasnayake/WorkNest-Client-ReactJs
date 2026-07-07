import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { Input } from "@/components/common/Input";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTeamsQuery } from "@/hooks/queries/useCoreQueries";
import { useRecruitmentJobsQuery, useRecruitmentPipelineQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { RecruitmentPipelineBoard } from "@/modules/recruitment/components/RecruitmentPipelineBoard";
import { hireApplication, updateApplicationStatus } from "@/modules/recruitment/services/recruitmentService";
import type {
  RecruitmentApplication,
  RecruitmentHireFormValues,
  RecruitmentHireRole,
  RecruitmentHireTeamRole,
} from "@/modules/recruitment/types";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/errorHandler";

const HIRE_ROLE_OPTIONS: Array<{ value: RecruitmentHireRole; label: string }> = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "HR", label: "HR" },
  { value: "TENANT_ADMIN", label: "Tenant Admin" },
];

const TEAM_ROLE_OPTIONS: Array<{ value: RecruitmentHireTeamRole; label: string }> = [
  { value: "MEMBER", label: "Member" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "BUSINESS_ANALYST", label: "Business Analyst" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "QA", label: "QA Engineer" },
  { value: "DESIGNER", label: "Designer" },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildHireDefaults(application?: RecruitmentApplication): RecruitmentHireFormValues {
  return {
    employeeCode: "",
    role: "EMPLOYEE",
    designation: application?.candidate.currentTitle ?? application?.jobPosition.title ?? "",
    department: application?.jobPosition.department ?? "",
    joinedDate: todayIsoDate(),
    temporaryPassword: "",
    teamId: "",
    teamFunctionalRole: "MEMBER",
    salary: application?.expectedSalary === undefined || application.expectedSalary === null ? "" : String(application.expectedSalary),
    recruiterNotes: application?.recruiterNotes ?? "",
  };
}

export function RecruitmentPipelinePage() {
  usePageMeta({ title: "Recruitment Pipeline", breadcrumb: ["Workspace", "Recruitment", "Pipeline"] });
  const queryClient = useQueryClient();
  const jobsQuery = useRecruitmentJobsQuery();
  const [jobPositionId, setJobPositionId] = useState<string>("ALL");
  const pipelineQuery = useRecruitmentPipelineQuery(jobPositionId === "ALL" ? undefined : jobPositionId);
  const [hireTarget, setHireTarget] = useState<RecruitmentApplication | null>(null);
  const [hireValues, setHireValues] = useState<RecruitmentHireFormValues>(() => buildHireDefaults());
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const teamsQuery = useTeamsQuery(Boolean(hireTarget));

  const selectedJobLabel = useMemo(() => jobsQuery.data?.items.find((job) => job.id === jobPositionId)?.title ?? "All jobs", [jobPositionId, jobsQuery.data?.items]);
  const applicationsById = useMemo(() => {
    const items = new Map<string, RecruitmentApplication>();
    for (const column of pipelineQuery.data?.columns ?? []) {
      for (const application of column.applications) {
        items.set(application.id, application);
      }
    }
    return items;
  }, [pipelineQuery.data]);

  async function handleMove(applicationId: string, stage: string) {
    setFeedback(null);
    if (stage === "HIRED") {
      const application = applicationsById.get(applicationId);
      if (!application) {
        setFeedback("Could not find the selected application. Refresh the pipeline and try again.");
        return;
      }
      if (application.status === "HIRED") {
        setFeedback("This candidate has already been hired.");
        return;
      }
      setHireTarget(application);
      setHireValues(buildHireDefaults(application));
      setFeedback("Complete the hire details to create the employee account.");
      return;
    }

    try {
      await updateApplicationStatus(applicationId, stage as never);
      await queryClient.invalidateQueries({ queryKey: ["recruitment", "pipeline"] });
      await queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
      setFeedback("Pipeline stage updated.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not update the pipeline stage."));
    }
  }

  async function handleHireSubmit() {
    if (!hireTarget) return;
    setFeedback(null);

    if (!hireValues.designation.trim() || !hireValues.department.trim() || !hireValues.joinedDate) {
      setFeedback("Designation, department, and joined date are required before hiring.");
      return;
    }
    if (hireValues.temporaryPassword.trim() && hireValues.temporaryPassword.trim().length < 8) {
      setFeedback("Temporary password must be at least 8 characters.");
      return;
    }
    if (hireValues.salary.trim()) {
      const salary = Number(hireValues.salary);
      if (Number.isNaN(salary) || salary < 0) {
        setFeedback("Salary must be a valid non-negative number.");
        return;
      }
    }

    setHireSubmitting(true);
    try {
      const result = await hireApplication(hireTarget.id, hireValues);
      await queryClient.invalidateQueries({ queryKey: ["recruitment"] });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      setHireTarget(null);
      setHireValues(buildHireDefaults());
      setFeedback(
        `Candidate hired as ${result.employee.name}. Employee account is ready.${result.temporaryPassword ? ` Temporary password: ${result.temporaryPassword}` : ""}`
      );
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not complete the hire workflow."));
    } finally {
      setHireSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Monitor all applications in a kanban-style hiring flow."
        actions={(
          <div className="flex items-center gap-2">
            <AppSelect value={jobPositionId} onChange={(event) => setJobPositionId(event.target.value)}>
              <option value="ALL">All jobs</option>
              {(jobsQuery.data?.items ?? []).map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </AppSelect>
            <Button variant="outline" onClick={() => void pipelineQuery.refetch()}>
              <ChevronDown size={16} />
              Refresh
            </Button>
          </div>
        )}
      />

      {feedback ? <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>{feedback}</div> : null}

      {hireTarget ? (
        <SectionCard
          title={`Hire ${hireTarget.candidate.fullName}`}
          subtitle="Create the employee record, login account, and optional team assignment from this selected candidate."
          action={(
            <Button variant="ghost" size="sm" onClick={() => { setHireTarget(null); setHireValues(buildHireDefaults()); }}>
              Cancel
            </Button>
          )}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleHireSubmit();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="hire-employee-code"
                label="Employee Code"
                value={hireValues.employeeCode}
                onChange={(event) => setHireValues((current) => ({ ...current, employeeCode: event.target.value.toUpperCase() }))}
                placeholder="Auto-generated if blank"
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hire-role" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Role</label>
                <AppSelect
                  id="hire-role"
                  value={hireValues.role}
                  onChange={(event) => setHireValues((current) => ({ ...current, role: event.target.value as RecruitmentHireRole }))}
                >
                  {HIRE_ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </AppSelect>
              </div>
              <Input
                id="hire-designation"
                label="Designation"
                value={hireValues.designation}
                onChange={(event) => setHireValues((current) => ({ ...current, designation: event.target.value }))}
                placeholder="e.g. Software Engineer"
                required
              />
              <Input
                id="hire-department"
                label="Department"
                value={hireValues.department}
                onChange={(event) => setHireValues((current) => ({ ...current, department: event.target.value }))}
                placeholder="e.g. Engineering"
                required
              />
              <Input
                id="hire-joined-date"
                label="Joined Date"
                type="date"
                value={hireValues.joinedDate}
                onChange={(event) => setHireValues((current) => ({ ...current, joinedDate: event.target.value }))}
                required
              />
              <Input
                id="hire-temporary-password"
                label="Temporary Password"
                type="password"
                value={hireValues.temporaryPassword}
                onChange={(event) => setHireValues((current) => ({ ...current, temporaryPassword: event.target.value }))}
                placeholder="Generated if blank"
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hire-team" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Team</label>
                <AppSelect
                  id="hire-team"
                  value={hireValues.teamId}
                  onChange={(event) => setHireValues((current) => ({ ...current, teamId: event.target.value }))}
                  disabled={teamsQuery.isLoading}
                >
                  <option value="">No team assignment</option>
                  {(teamsQuery.data ?? []).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </AppSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hire-team-role" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Team Role</label>
                <AppSelect
                  id="hire-team-role"
                  value={hireValues.teamFunctionalRole}
                  onChange={(event) => setHireValues((current) => ({ ...current, teamFunctionalRole: event.target.value as RecruitmentHireTeamRole }))}
                  disabled={!hireValues.teamId}
                >
                  {TEAM_ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </AppSelect>
              </div>
              <Input
                id="hire-salary"
                label="Salary"
                type="number"
                min="0"
                value={hireValues.salary}
                onChange={(event) => setHireValues((current) => ({ ...current, salary: event.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hire-notes" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Recruiter Notes</label>
              <textarea
                id="hire-notes"
                className="min-h-24 w-full rounded-xl border px-4 py-2.5 text-sm"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                value={hireValues.recruiterNotes}
                onChange={(event) => setHireValues((current) => ({ ...current, recruiterNotes: event.target.value }))}
                placeholder="Optional handoff notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setHireTarget(null); setHireValues(buildHireDefaults()); }}>
                Cancel
              </Button>
              <Button type="submit" loading={hireSubmitting} loadingLabel="Hiring candidate">
                Hire and Create Employee
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title={selectedJobLabel} subtitle="Move cards between stages to update application status.">
        {pipelineQuery.isError ? (
          <ErrorBanner message="Failed to load pipeline." onRetry={() => void pipelineQuery.refetch()} />
        ) : pipelineQuery.isLoading || !pipelineQuery.data ? (
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} cols={1} />)}
          </div>
        ) : pipelineQuery.data.columns.length === 0 ? (
          <EmptyState title="No pipeline data" description="Create applications to populate the hiring pipeline." />
        ) : (
          <RecruitmentPipelineBoard pipeline={pipelineQuery.data} onMove={handleMove} />
        )}
      </SectionCard>
    </div>
  );
}
