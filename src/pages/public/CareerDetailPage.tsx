import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import { PageContainer } from "@/components/common/PageContainer";
import { PublicJobView } from "@/modules/careers/components/PublicJobView";
import { getPublicCareerDetail } from "@/modules/careers/services/publicCareersService";
import type { PublicCareerJobDetail } from "@/modules/careers/types";
import { useSeoMeta } from "@/hooks/useSeoMeta";

export function CareerDetailPage() {
  const { tenantSlug = "", jobSlug = "" } = useParams();
  const [job, setJob] = useState<PublicCareerJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useSeoMeta({ title: job ? `${job.title} at ${job.company.companyName}` : "Career Opportunity", description: job?.summary ?? "Explore this job opportunity.", canonicalPath: tenantSlug && jobSlug ? `/${tenantSlug}/careers/${jobSlug}` : undefined });
  useEffect(() => { let active = true; getPublicCareerDetail(tenantSlug, jobSlug).then((result) => { if (active) { setJob(result); setError(false); } }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [jobSlug, retry, tenantSlug]);
  if (loading) return <PageContainer><div className="grid animate-pulse gap-6 lg:grid-cols-[1fr_20rem]"><div className="h-[40rem] rounded-3xl" style={{ background: "var(--bg-muted)" }} /><div className="h-80 rounded-3xl" style={{ background: "var(--bg-muted)" }} /></div></PageContainer>;
  if (error || !job) return <PageContainer className="space-y-4"><ErrorBanner message="This job opening is not available." onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} /><Button to={`/${tenantSlug}/careers`} variant="outline">Back to careers</Button></PageContainer>;
  return <PageContainer><PublicJobView job={job} tenantSlug={tenantSlug} /></PageContainer>;
}
