import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useRecruitmentJobsQuery, useRecruitmentPipelineQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { RecruitmentPipelineBoard } from "@/modules/recruitment/components/RecruitmentPipelineBoard";
import { updateApplicationStatus } from "@/modules/recruitment/services/recruitmentService";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/errorHandler";

export function RecruitmentPipelinePage() {
  usePageMeta({ title: "Recruitment Pipeline", breadcrumb: ["Workspace", "Recruitment", "Pipeline"] });
  const queryClient = useQueryClient();
  const jobsQuery = useRecruitmentJobsQuery();
  const [jobPositionId, setJobPositionId] = useState<string>("ALL");
  const pipelineQuery = useRecruitmentPipelineQuery(jobPositionId === "ALL" ? undefined : jobPositionId);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedJobLabel = useMemo(() => jobsQuery.data?.items.find((job) => job.id === jobPositionId)?.title ?? "All jobs", [jobPositionId, jobsQuery.data?.items]);

  async function handleMove(applicationId: string, stage: string) {
    setFeedback(null);
    try {
      await updateApplicationStatus(applicationId, stage as never);
      await queryClient.invalidateQueries({ queryKey: ["recruitment", "pipeline"] });
      await queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
      setFeedback("Pipeline stage updated.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not update the pipeline stage."));
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