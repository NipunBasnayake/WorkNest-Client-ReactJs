import { ArrowLeft } from "lucide-react";
import { useParams } from "react-router-dom";
import { ErrorBanner } from "@/components/common/AppUI";
import { LoadingSkeleton } from "@/components/common/AsyncStates";
import { Button } from "@/components/common/Button";
import { InlineAlert } from "@/components/common/InlineAlert";
import { PageHeader } from "@/components/common/PageHeader";
import { PublicJobView } from "@/modules/careers/components/PublicJobView";
import { useRecruitmentJobQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { usePageMeta } from "@/hooks/usePageMeta";
import { tenantRoutes } from "@/utils/tenantRoutes";

export function RecruitmentJobPreviewPage() {
  const { tenantSlug = "", jobId } = useParams();
  usePageMeta({ title: "Job Preview", breadcrumb: ["Workspace", "Recruitment", "Job Openings", "Preview"] });
  const query = useRecruitmentJobQuery(jobId);
  if (query.isLoading) return <LoadingSkeleton lines={10} />;
  if (query.isError || !query.data) return <ErrorBanner message="Could not load this job preview." onRetry={() => void query.refetch()} />;
  const job = query.data;
  return <div className="space-y-6">
    <PageHeader title="Job Page Preview" description="Review the candidate-facing page without leaving the WorkNest recruitment workspace." backButton={<Button variant="ghost" size="sm" to={tenantRoutes.recruitmentJobs(tenantSlug)}><ArrowLeft size={15} />Back to jobs</Button>} />
    <InlineAlert tone="info" message="Preview mode: application and public sharing actions are disabled." />
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
      <PublicJobView preview tenantSlug={tenantSlug} job={{ company: { tenantSlug, companyName: tenantSlug, about: `Explore opportunities at ${tenantSlug}.` }, slug: job.slug ?? `draft-${job.id}`, title: job.title, department: job.department, employmentType: job.employmentType, location: job.location, experience: job.experience, description: job.description, summary: job.description?.slice(0, 180), postedDate: job.publishedAt ?? job.createdAt, expiry: job.expiresAt }} />
    </div>
  </div>;
}
