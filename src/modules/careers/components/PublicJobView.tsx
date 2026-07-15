import { ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, Clock, MapPin, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { SectionCard } from "@/components/common/SectionCard";
import { MarkdownContent } from "@/modules/recruitment/components/MarkdownContent";
import { PublicShareMenu } from "@/modules/careers/components/PublicShareMenu";
import { buildCareersUrl, buildVacancyUrl } from "@/modules/careers/share";
import type { PublicCareerJobDetail } from "@/modules/careers/types";
import { formatEmploymentType, formatPublicDate } from "@/modules/careers/utils";

export function PublicJobView({ job, tenantSlug, preview = false }: { job: PublicCareerJobDetail; tenantSlug: string; preview?: boolean }) {
  const careersUrl = buildCareersUrl(tenantSlug);
  const vacancyUrl = buildVacancyUrl(tenantSlug, job.slug);
  const applyTo = preview ? undefined : `/${tenantSlug}/careers/${job.slug}/apply`;
  return <div className="space-y-7">
    <div className="flex flex-col gap-5 rounded-3xl border p-6 shadow-sm sm:p-8" style={{ borderColor: "var(--border-default)", background: "linear-gradient(135deg,color-mix(in srgb,var(--bg-surface) 94%,#7c3aed),var(--bg-surface))" }}>
      <Link to={preview ? `/${tenantSlug}/recruitment/jobs` : `/${tenantSlug}/careers`} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium no-underline" style={{ color: "var(--text-secondary)" }}><ArrowLeft size={15} />{preview ? "Back to job openings" : "Back to careers"}</Link>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0"><div className="mb-3 flex flex-wrap gap-2">{preview ? <Badge variant="warning">Preview</Badge> : <Badge variant="success">Open position</Badge>}{job.department ? <Badge variant="secondary">{job.department}</Badge> : null}</div><h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>{job.title}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: "var(--text-secondary)" }}><Meta icon={<BriefcaseBusiness size={15} />} text={formatEmploymentType(job.employmentType)} /><Meta icon={<MapPin size={15} />} text={job.location ?? "Location flexible"} /><Meta icon={<CalendarDays size={15} />} text={`Posted ${formatPublicDate(job.postedDate)}`} /></div></div>
        <div className="flex flex-wrap gap-2">{applyTo ? <Button size="md" to={applyTo}>Apply Now</Button> : <Button size="md" disabled>Apply Now</Button>}<PublicShareMenu careersUrl={careersUrl} vacancyUrl={vacancyUrl} vacancyTitle={job.title} companyName={job.company.companyName} /></div>
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-6"><SectionCard><MarkdownContent>{job.description || "No job description has been provided."}</MarkdownContent></SectionCard>
        <SectionCard title="About the company"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>{job.company.logoUrl ? <img src={job.company.logoUrl} alt={`${job.company.companyName} logo`} className="h-full w-full object-cover" /> : <Building2 size={22} className="text-purple-600" />}</div><div><p className="font-semibold" style={{ color: "var(--text-primary)" }}>{job.company.companyName}</p><p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{job.company.about ?? `Build your career with ${job.company.companyName}.`}</p></div></div></SectionCard>
        {!preview && job.relatedJobs?.length ? <SectionCard title="Related jobs"><div className="grid gap-3 sm:grid-cols-2">{job.relatedJobs.map((related) => <Link key={related.slug} to={`/${tenantSlug}/careers/${related.slug}`} className="rounded-xl border p-4 no-underline transition hover:-translate-y-0.5" style={{ borderColor: "var(--border-default)" }}><p className="font-semibold" style={{ color: "var(--text-primary)" }}>{related.title}</p><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{[related.department, related.location].filter(Boolean).join(" · ")}</p></Link>)}</div></SectionCard> : null}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24"><SectionCard title="Role details" variant="dense"><div className="space-y-4"><Fact icon={<BriefcaseBusiness size={16} />} label="Employment" value={formatEmploymentType(job.employmentType)} /><Fact icon={<MapPin size={16} />} label="Location" value={job.location ?? "Not specified"} /><Fact icon={<Clock size={16} />} label="Experience" value={job.experience ?? "Not specified"} /><Fact icon={<CalendarDays size={16} />} label="Deadline" value={formatPublicDate(job.expiry)} /></div></SectionCard><div className="rounded-2xl bg-purple-600 p-5 text-white shadow-lg shadow-purple-600/20"><Share2 size={20} /><p className="mt-3 font-semibold">Know someone suitable?</p><p className="mt-1 text-sm text-purple-100">Share this opportunity with your network.</p><div className="mt-4"><PublicShareMenu careersUrl={careersUrl} vacancyUrl={vacancyUrl} vacancyTitle={job.title} companyName={job.company.companyName} /></div></div>{applyTo ? <Button className="w-full lg:hidden" to={applyTo}>Apply Now</Button> : null}</aside>
    </div>
    {applyTo ? <div className="fixed inset-x-0 bottom-0 z-30 border-t p-3 backdrop-blur lg:hidden" style={{ borderColor: "var(--border-default)", background: "color-mix(in srgb,var(--bg-surface) 92%,transparent)" }}><Button className="w-full" to={applyTo}>Apply for {job.title}</Button></div> : null}
  </div>;
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) { return <span className="inline-flex items-center gap-1.5">{icon}{text}</span>; }
function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-start gap-3"><span className="mt-0.5 text-purple-600">{icon}</span><div><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</p><p className="mt-0.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</p></div></div>; }
