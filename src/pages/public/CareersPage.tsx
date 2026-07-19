import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { BriefcaseBusiness, CalendarDays, Link2, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { useToast } from "@/hooks/useToast";
import { getPublicCareers } from "@/modules/careers/services/publicCareersService";
import { buildCareersUrl, copyPublicUrl } from "@/modules/careers/share";
import type { PublicCareerJobSummary, PublicCareersResponse, PublicEmploymentType } from "@/modules/careers/types";
import { formatEmploymentType, formatPublicDate } from "@/modules/careers/utils";
import { TenantLogo } from "@/features/branding/TenantLogo";

export function CareersPage() {
  const { tenantSlug = "" } = useParams();
  const toast = useToast();
  const [data, setData] = useState<PublicCareersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [employmentType, setEmploymentType] = useState("all");
  const careersUrl = tenantSlug ? buildCareersUrl(tenantSlug) : "";

  useSeoMeta({
    title: data?.company.companyName ? `${data.company.companyName} Careers` : "Careers",
    description: data?.company.about ?? "Explore current open positions.",
    canonicalPath: tenantSlug ? `/${tenantSlug}/careers` : undefined,
  });

  useEffect(() => {
    let active = true;

    getPublicCareers(tenantSlug)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch(() => {
        if (!active) return;
        setError("This careers page is not available.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryKey, tenantSlug]);

  const jobs = useMemo(() => data?.jobs ?? [], [data?.jobs]);
  const departments = useMemo(() => uniqueOptions<string>(jobs.map((job) => job.department)), [jobs]);
  const employmentTypes = useMemo(() => uniqueOptions<PublicEmploymentType>(jobs.map((job) => job.employmentType)), [jobs]);
  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        [job.title, job.department, job.location, job.summary].some((value) => value?.toLowerCase().includes(query));
      const matchesDepartment = department === "all" || job.department === department;
      const matchesType = employmentType === "all" || job.employmentType === employmentType;
      return matchesSearch && matchesDepartment && matchesType;
    });
  }, [department, employmentType, jobs, search]);

  async function handleShareCareers() {
    if (!careersUrl) return;
    const outcome = await copyPublicUrl(careersUrl);
    if (outcome === "copied") {
      toast.success({ title: "Careers page copied" });
    } else if (outcome === "prompt") {
      toast.info({ title: "Copy the public link", description: "Use the selectable URL dialog to copy the careers page." });
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-5">
          <div className="h-24 animate-pulse rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }} />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }} />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer size="lg">
        <ErrorBanner message={error ?? "Unable to load careers."} onRetry={() => { setLoading(true); setError(null); setRetryKey((value) => value + 1); }} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      <CompanyHeader
        companyName={data.company.companyName}
        about={data.company.about}
        onShareCareers={handleShareCareers}
      />

      <PageHeader
        title="Open Positions"
        description={`${filteredJobs.length} role${filteredJobs.length === 1 ? "" : "s"} currently open.`}
      />

      <SectionCard title="Find a role" subtitle="Search and filter public vacancies for this company.">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative block">
            <span className="sr-only">Search jobs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--text-tertiary)" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, department, or location"
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/25"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            />
          </label>

          <SelectFilter label="Department" value={department} onChange={setDepartment} options={departments} />
          <SelectFilter
            label="Employment type"
            value={employmentType}
            onChange={setEmploymentType}
            options={employmentTypes}
            formatLabel={formatEmploymentType}
          />
        </div>
      </SectionCard>

      {filteredJobs.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<BriefcaseBusiness size={24} />}
            title="No public roles found"
            description="Adjust your search or filters to see more openings."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => (
            <JobCard key={job.slug} job={job} tenantSlug={tenantSlug} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function CompanyHeader({
  companyName,
  about,
  onShareCareers,
}: {
  companyName: string;
  about?: string;
  onShareCareers: () => void;
}) {
  return (
    <section className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex min-h-16 min-w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2" style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}>
            <TenantLogo size="settings" showName={false} eager />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--color-primary-600)" }}>Careers</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{companyName}</h1>
            {about ? <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{about}</p> : null}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onShareCareers}
          title="Share Careers"
          aria-label={`Share ${companyName} careers page`}
          className="w-full sm:w-auto"
        >
          <Link2 size={16} />
          Share Careers
        </Button>
      </div>
    </section>
  );
}

function SelectFilter<TOption extends string>({
  label,
  value,
  onChange,
  options,
  formatLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: TOption[];
  formatLabel?: (value: TOption) => string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/25"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
      >
        <option value="all">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel ? formatLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function JobCard({ job, tenantSlug }: { job: PublicCareerJobSummary; tenantSlug: string }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex flex-wrap items-center gap-2">
        {job.department ? <Badge variant="secondary">{job.department}</Badge> : null}
        {job.employmentType ? <Badge variant="info">{formatEmploymentType(job.employmentType)}</Badge> : null}
      </div>

      <div className="mt-4 flex-1">
        <Link to={`/${tenantSlug}/careers/${job.slug}`} className="text-lg font-semibold no-underline hover:text-primary-600" style={{ color: "var(--text-primary)" }}>
          {job.title}
        </Link>
        {job.summary ? <p className="mt-2 line-clamp-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{job.summary}</p> : null}
      </div>

      <div className="mt-5 grid gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        <MetaRow icon={<MapPin size={15} />} value={job.location ?? "Location not specified"} />
        <MetaRow icon={<BriefcaseBusiness size={15} />} value={job.experience ?? "Experience not specified"} />
        <MetaRow icon={<CalendarDays size={15} />} value={`Posted ${formatPublicDate(job.postedDate)}`} />
        {job.salary ? <MetaRow icon={<span className="text-xs font-bold">Rs</span>} value={job.salary} /> : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" to={`/${tenantSlug}/careers/${job.slug}`}>View role</Button>
        <Button variant="secondary" size="sm" to={`/${tenantSlug}/careers/${job.slug}/apply`}>Apply</Button>
      </div>
    </article>
  );
}

function MetaRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center" style={{ color: "var(--text-tertiary)" }}>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

function uniqueOptions<TOption extends string>(values: Array<TOption | undefined>) {
  return Array.from(new Set(values.filter((value): value is TOption => Boolean(value)))).sort((a, b) => a.localeCompare(b));
}
