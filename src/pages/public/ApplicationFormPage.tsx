import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, FileText, UploadCloud } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/components/common/PageContainer";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorBanner } from "@/components/common/AppUI";
import { getPublicCareerDetail } from "@/modules/careers/services/publicCareersService";
import { submitPublicApplication } from "@/modules/careers/services/publicApplicationsService";
import type { PublicApplicationFormValues, PublicCareerJobDetail } from "@/modules/careers/types";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { getErrorMessage } from "@/utils/errorHandler";

const EMPTY: PublicApplicationFormValues = { fullName: "", email: "", phone: "", linkedIn: "", portfolio: "", currentCompany: "", currentPosition: "", expectedSalary: "", coverLetter: "", resume: null };

export function ApplicationFormPage() {
  const { tenantSlug = "", jobSlug = "" } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<PublicCareerJobDetail | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useSeoMeta({ title: job ? `Apply for ${job.title}` : "Apply", description: "Submit your application.", noIndex: true });

  useEffect(() => { let active = true; getPublicCareerDetail(tenantSlug, jobSlug).then((result) => { if (active) setJob(result); }).catch(() => { if (active) setError("This job opening is not available for applications."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [jobSlug, tenantSlug]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.fullName.trim().split(/\s+/).length < 2) { setError("Enter your full name."); return; }
    if (!form.resume) { setError("Upload your CV before submitting."); return; }
    if (form.resume.size > 10 * 1024 * 1024) { setError("Your CV must be 10 MB or smaller."); return; }
    setSubmitting(true);
    try {
      const application = await submitPublicApplication(tenantSlug, jobSlug, form, setProgress);
      navigate(`/${tenantSlug}/applications/${application.referenceNumber}/success`, { replace: true, state: { application } });
    } catch (caught) { setError(getErrorMessage(caught, "We could not submit your application. Please review the form and try again.")); }
    finally { setSubmitting(false); }
  }

  if (loading) return <PageContainer><div className="h-[42rem] animate-pulse rounded-3xl" style={{ background: "var(--bg-muted)" }} /></PageContainer>;
  if (!job) return <PageContainer className="space-y-4"><ErrorBanner message={error ?? "This job opening is not available."} /><Button to={`/${tenantSlug}/careers`} variant="outline">Back to careers</Button></PageContainer>;

  return <PageContainer className="space-y-6">
    <Button size="sm" variant="ghost" to={`/${tenantSlug}/careers/${job.slug}`}><ArrowLeft size={15} />Back to job</Button>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <form className="space-y-6" onSubmit={submit}>
        <div><p className="text-sm font-semibold text-primary-600">Apply to {job.company.companyName}</p><h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{job.title}</h1><p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Complete the form below. No account or login is required.</p></div>
        {error ? <ErrorBanner message={error} /> : null}
        <SectionCard title="Your details"><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Input id="app-full-name" label="Full name" autoComplete="name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required /></div><Input id="app-email" label="Email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /><Input id="app-phone" label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required /><Input id="app-linkedin" label="LinkedIn (optional)" type="url" value={form.linkedIn} onChange={(event) => setForm((current) => ({ ...current, linkedIn: event.target.value }))} placeholder="https://linkedin.com/in/..." /><Input id="app-portfolio" label="Portfolio (optional)" type="url" value={form.portfolio} onChange={(event) => setForm((current) => ({ ...current, portfolio: event.target.value }))} placeholder="https://..." /><Input id="app-company" label="Current company (optional)" value={form.currentCompany} onChange={(event) => setForm((current) => ({ ...current, currentCompany: event.target.value }))} /><Input id="app-position" label="Current position (optional)" value={form.currentPosition} onChange={(event) => setForm((current) => ({ ...current, currentPosition: event.target.value }))} /><Input id="app-salary" label="Expected salary (optional)" type="number" min="0" value={form.expectedSalary} onChange={(event) => setForm((current) => ({ ...current, expectedSalary: event.target.value }))} /></div></SectionCard>
        <SectionCard title="Application"><div className="space-y-5"><div><label htmlFor="app-cover-letter" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Cover letter</label><textarea id="app-cover-letter" value={form.coverLetter} onChange={(event) => setForm((current) => ({ ...current, coverLetter: event.target.value }))} placeholder="Tell us why this role interests you and what you would bring to the team." className="min-h-44 w-full rounded-xl border bg-transparent px-4 py-3 text-sm leading-6 outline-none focus:border-primary-500" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }} /></div><label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition hover:border-primary-400" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}><UploadCloud size={28} className="text-primary-600" /><span className="mt-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{form.resume?.name ?? "Upload CV"}</span><span className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>PDF or DOCX, up to 10 MB</span><input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => setForm((current) => ({ ...current, resume: event.target.files?.[0] ?? null }))} required /></label>{submitting ? <div><div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--bg-muted)" }}><div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Uploading application… {progress}%</p></div> : null}<p className="text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>By submitting, you confirm the information is accurate and agree that {job.company.companyName} may use it to assess this application.</p><Button type="submit" size="lg" className="w-full sm:w-auto" loading={submitting} loadingLabel="Submitting application">Submit Application</Button></div></SectionCard>
      </form>
      <aside className="lg:sticky lg:top-24"><SectionCard title="Job summary"><div className="space-y-4"><Summary icon={<BriefcaseBusiness size={16} />} label="Role" value={job.title} /><Summary icon={<FileText size={16} />} label="Department" value={job.department ?? "Not specified"} /><Summary icon={<FileText size={16} />} label="Location" value={job.location ?? "Not specified"} /></div></SectionCard></aside>
    </div>
  </PageContainer>;
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3"><span className="text-primary-600">{icon}</span><div><p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</p></div></div>; }
