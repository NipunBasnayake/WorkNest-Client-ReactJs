import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { PublicShareMenu } from "@/modules/careers/components/PublicShareMenu";
import { getPublicCareerDetail } from "@/modules/careers/services/publicCareersService";
import { buildCareersUrl, buildVacancyUrl } from "@/modules/careers/share";
import type { PublicCareerJobDetail } from "@/modules/careers/types";
import { formatEmploymentType, formatPublicDate, splitRichText } from "@/modules/careers/utils";

export function CareerDetailPage() {
  const { tenantSlug = "", jobSlug = "" } = useParams();
  const [job, setJob] = useState<PublicCareerJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useSeoMeta({
    title: job ? `${job.title} at ${job.company.companyName}` : "Career Opportunity",
    description: job?.summary ?? "Explore this public job vacancy.",
    canonicalPath: tenantSlug && jobSlug ? `/${tenantSlug}/careers/${jobSlug}` : undefined,
  });

  useEffect(() => {
    let active = true;

    getPublicCareerDetail(tenantSlug, jobSlug)
      .then((result) => {
        if (!active) return;
        setJob(result);
      })
      .catch(() => {
        if (!active) return;
        setError("This vacancy is not available.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobSlug, retryKey, tenantSlug]);

  if (loading) {
    return (
      <PageContainer>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="h-[520px] animate-pulse rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }} />
          <div className="h-80 animate-pulse rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }} />
        </div>
      </PageContainer>
    );
  }

  if (error || !job) {
    return (
      <PageContainer size="lg" className="space-y-5">
        <ErrorBanner message={error ?? "Unable to load this vacancy."} onRetry={() => { setLoading(true); setError(null); setRetryKey((value) => value + 1); }} />
        <Button variant="secondary" size="sm" to={`/${tenantSlug}/careers`}>Back to careers</Button>
      </PageContainer>
    );
  }

  const careersUrl = buildCareersUrl(tenantSlug);
  const vacancyUrl = buildVacancyUrl(tenantSlug, job.slug);

  return (
    <PageContainer className="space-y-7">
      <PageHeader
        title={job.title}
        description={job.summary}
        breadcrumb={
          <Link to={`/${tenantSlug}/careers`} className="inline-flex items-center gap-1.5 text-sm font-medium no-underline hover:text-primary-600" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={15} />
            Back to careers
          </Link>
        }
        status={<Badge variant="success">Public vacancy</Badge>}
        actions={
          <>
            <Button variant="primary" size="md" to={`/${tenantSlug}/careers/${job.slug}/apply`}>
              Apply
            </Button>
            <PublicShareMenu
              careersUrl={careersUrl}
              vacancyUrl={vacancyUrl}
              vacancyTitle={job.title}
              companyName={job.company.companyName}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-5">
          <SectionCard title="Overview">
            <RichText value={job.description ?? job.summary} emptyMessage="No public overview has been provided for this role." />
          </SectionCard>

          <DetailSection title="Responsibilities" value={job.responsibilities} />
          <DetailSection title="Requirements" value={job.requirements} />
          <DetailSection title="Benefits" value={job.benefits} />

          <SectionCard title="Company">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border" style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}>
                {job.company.logoUrl ? (
                  <img src={job.company.logoUrl} alt={`${job.company.companyName} logo`} className="h-full w-full object-cover" />
                ) : (
                  <Building2 size={22} style={{ color: "var(--color-primary-500)" }} aria-hidden="true" />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{job.company.companyName}</h2>
                {job.company.about ? <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{job.company.about}</p> : null}
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <SectionCard title="Role Details" variant="dense">
            <div className="space-y-3">
              <Fact icon={<MapPin size={16} />} label="Location" value={job.location ?? "Not specified"} />
              <Fact icon={<BriefcaseBusiness size={16} />} label="Employment type" value={formatEmploymentType(job.employmentType)} />
              <Fact icon={<Clock size={16} />} label="Experience" value={job.experience ?? "Not specified"} />
              <Fact icon={<span className="text-xs font-bold">Rs</span>} label="Salary" value={job.salary ?? "Not specified"} />
              <Fact icon={<CalendarDays size={16} />} label="Posted" value={formatPublicDate(job.postedDate)} />
              <Fact icon={<CalendarDays size={16} />} label="Expiry" value={formatPublicDate(job.expiry)} />
            </div>
          </SectionCard>

          <SectionCard variant="dense">
            <div className="space-y-3">
              <Button variant="primary" size="md" className="w-full" to={`/${tenantSlug}/careers/${job.slug}/apply`}>
                Apply
              </Button>
              <p className="text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
                Submit your profile and resume for this vacancy.
              </p>
            </div>
          </SectionCard>
        </aside>
      </div>
    </PageContainer>
  );
}

function DetailSection({ title, value }: { title: string; value?: string }) {
  return (
    <SectionCard title={title}>
      <RichText value={value} emptyMessage={`${title} are not specified for this role.`} />
    </SectionCard>
  );
}

function RichText({ value, emptyMessage }: { value?: string; emptyMessage: string }) {
  const items = splitRichText(value);
  if (items.length === 0) {
    return <EmptyState title="Not specified" description={emptyMessage} />;
  }

  if (items.length === 1) {
    return <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{items[0]}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary-500)" }} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-tertiary)" }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</div>
        <div className="mt-0.5 break-words text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}
