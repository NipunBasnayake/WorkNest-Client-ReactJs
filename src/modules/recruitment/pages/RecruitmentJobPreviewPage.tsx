import { useParams } from "react-router-dom";
import { ErrorBanner } from "@/components/common/AppUI";
import { LoadingSkeleton } from "@/components/common/AsyncStates";
import { PublicJobView } from "@/modules/careers/components/PublicJobView";
import { useRecruitmentJobQuery } from "@/modules/recruitment/hooks/useRecruitment";
import { usePageMeta } from "@/hooks/usePageMeta";

export function RecruitmentJobPreviewPage() {
  const { tenantSlug = "", jobId } = useParams();
  usePageMeta({ title: "Job Preview", breadcrumb: ["Workspace", "Recruitment", "Job Openings", "Preview"] });
  const query = useRecruitmentJobQuery(jobId);
  if (query.isLoading) return <LoadingSkeleton lines={10} />;
  if (query.isError || !query.data) return <ErrorBanner message="Could not load this job preview." onRetry={() => void query.refetch()} />;
  const job = query.data;
  return <PublicJobView preview tenantSlug={tenantSlug} job={{ company: { tenantSlug, companyName: tenantSlug, about: `Explore opportunities at ${tenantSlug}.` }, slug: job.slug ?? `draft-${job.id}`, title: job.title, department: job.department, employmentType: job.employmentType, location: job.location, experience: job.experience, description: job.description, summary: job.description?.slice(0, 180), postedDate: job.publishedAt ?? job.createdAt, expiry: job.expiresAt }} />;
}
