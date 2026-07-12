import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, FileText, Send, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import { Input } from "@/components/common/Input";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { TextareaField } from "@/components/common/TextareaField";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { getPublicCareerDetail } from "@/modules/careers/services/publicCareersService";
import { submitPublicApplication } from "@/modules/careers/services/publicApplicationsService";
import type { PublicApplicationFormValues, PublicCareerJobDetail } from "@/modules/careers/types";
import { formatEmploymentType } from "@/modules/careers/utils";
import { getErrorMessage } from "@/utils/errorHandler";

const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const EMPTY_FORM: PublicApplicationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  currentCity: "",
  country: "",
  linkedIn: "",
  portfolio: "",
  yearsOfExperience: "",
  currentCompany: "",
  currentPosition: "",
  expectedSalary: "",
  availableFrom: "",
  coverLetter: "",
  resume: null,
};

type FieldErrors = Partial<Record<keyof PublicApplicationFormValues, string>>;

export function ApplicationFormPage() {
  const { tenantSlug = "", jobSlug = "" } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<PublicCareerJobDetail | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [form, setForm] = useState<PublicApplicationFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useSeoMeta({
    title: job ? `Apply for ${job.title}` : "Apply for Vacancy",
    description: job?.summary ?? "Submit your application for this public vacancy.",
    canonicalPath: tenantSlug && jobSlug ? `/${tenantSlug}/careers/${jobSlug}/apply` : undefined,
  });

  useEffect(() => {
    let active = true;
    setLoadingJob(true);
    setJobError(null);

    getPublicCareerDetail(tenantSlug, jobSlug)
      .then((result) => {
        if (active) setJob(result);
      })
      .catch(() => {
        if (active) setJobError("This vacancy is not available for applications.");
      })
      .finally(() => {
        if (active) setLoadingJob(false);
      });

    return () => {
      active = false;
    };
  }, [jobSlug, retryKey, tenantSlug]);

  const isSubmitDisabled = submitting;
  const selectedFileLabel = useMemo(() => {
    if (!form.resume) return "No resume selected";
    return `${form.resume.name} (${formatFileSize(form.resume.size)})`;
  }, [form.resume]);

  function updateField(field: keyof PublicApplicationFormValues, value: string) {
    const next = { ...form, [field]: value };
    setForm(next);
    setErrors(validateForm(next));
  }

  function updateResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const next = { ...form, resume: file };
    setForm(next);
    setErrors(validateForm(next));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setUploadProgress(0);
    try {
      const response = await submitPublicApplication(tenantSlug, jobSlug, form, setUploadProgress);
      navigate(`/${tenantSlug}/applications/${encodeURIComponent(response.referenceNumber)}/success`, {
        replace: true,
        state: { application: response },
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Could not submit your application."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingJob) {
    return (
      <PageContainer>
        <div className="h-[560px] animate-pulse rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }} />
      </PageContainer>
    );
  }

  if (jobError || !job) {
    return (
      <PageContainer size="lg" className="space-y-5">
        <ErrorBanner message={jobError ?? "Unable to load this vacancy."} onRetry={() => setRetryKey((value) => value + 1)} />
        <Button variant="secondary" size="sm" to={`/${tenantSlug}/careers`}>Back to careers</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-7">
      <PageHeader
        title={`Apply for ${job.title}`}
        description={`${job.company.companyName} · ${job.department ?? "General"} · ${formatEmploymentType(job.employmentType)}`}
        breadcrumb={
          <Link to={`/${tenantSlug}/careers/${job.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium no-underline hover:text-primary-600" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={15} />
            Back to vacancy
          </Link>
        }
      />

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <SectionCard title="Personal Information" action={<UserRound size={18} style={{ color: "var(--text-tertiary)" }} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="app-first-name" label="First Name" value={form.firstName} error={errors.firstName} onChange={(event) => updateField("firstName", event.target.value)} autoComplete="given-name" required />
              <Input id="app-last-name" label="Last Name" value={form.lastName} error={errors.lastName} onChange={(event) => updateField("lastName", event.target.value)} autoComplete="family-name" required />
              <Input id="app-email" label="Email" type="email" value={form.email} error={errors.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" required />
              <Input id="app-phone" label="Phone" value={form.phone} error={errors.phone} onChange={(event) => updateField("phone", event.target.value)} autoComplete="tel" />
              <Input id="app-city" label="Current City" value={form.currentCity} error={errors.currentCity} onChange={(event) => updateField("currentCity", event.target.value)} autoComplete="address-level2" />
              <Input id="app-country" label="Country" value={form.country} error={errors.country} onChange={(event) => updateField("country", event.target.value)} autoComplete="country-name" />
            </div>
          </SectionCard>

          <SectionCard title="Professional Information" action={<BriefcaseBusiness size={18} style={{ color: "var(--text-tertiary)" }} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="app-current-company" label="Current Company" value={form.currentCompany} error={errors.currentCompany} onChange={(event) => updateField("currentCompany", event.target.value)} />
              <Input id="app-current-position" label="Current Position" value={form.currentPosition} error={errors.currentPosition} onChange={(event) => updateField("currentPosition", event.target.value)} />
              <Input id="app-years-experience" label="Years of Experience" type="number" min={0} max={80} value={form.yearsOfExperience} error={errors.yearsOfExperience} onChange={(event) => updateField("yearsOfExperience", event.target.value)} />
              <Input id="app-expected-salary" label="Expected Salary" type="number" min={0} value={form.expectedSalary} error={errors.expectedSalary} onChange={(event) => updateField("expectedSalary", event.target.value)} />
              <Input id="app-available-from" label="Available From" type="date" value={form.availableFrom} error={errors.availableFrom} onChange={(event) => updateField("availableFrom", event.target.value)} />
              <Input id="app-linkedin" label="LinkedIn" value={form.linkedIn} error={errors.linkedIn} onChange={(event) => updateField("linkedIn", event.target.value)} />
              <Input id="app-portfolio" label="Portfolio" value={form.portfolio} error={errors.portfolio} onChange={(event) => updateField("portfolio", event.target.value)} className="sm:col-span-2" />
            </div>
          </SectionCard>

          <SectionCard title="Documents" action={<Upload size={18} style={{ color: "var(--text-tertiary)" }} />}>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Resume *</span>
                <input
                  id="app-resume"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={updateResume}
                  className="mt-2 block w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--bg-muted)] file:px-3 file:py-1.5 file:text-sm file:font-semibold"
                  style={{ borderColor: errors.resume ? "#f87171" : "var(--border-default)", color: "var(--text-primary)" }}
                  required
                />
              </label>
              <div className="flex items-center gap-2 text-sm" style={{ color: errors.resume ? "#ef4444" : "var(--text-secondary)" }}>
                <FileText size={15} />
                <span>{errors.resume ?? selectedFileLabel}</span>
              </div>
              {submitting ? (
                <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Cover Letter">
            <TextareaField
              id="app-cover-letter"
              label="Cover Letter"
              rows={7}
              value={form.coverLetter}
              error={errors.coverLetter}
              onChange={(event) => updateField("coverLetter", event.target.value)}
            />
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <SectionCard title="Application" variant="dense">
            <div className="space-y-3">
              <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                {job.title} at {job.company.companyName}
              </p>
              <Button type="submit" variant="primary" size="md" className="w-full" loading={submitting} disabled={isSubmitDisabled}>
                <Send size={16} />
                Submit Application
              </Button>
            </div>
          </SectionCard>
        </aside>
      </form>
    </PageContainer>
  );
}

function validateForm(values: PublicApplicationFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.firstName.trim()) errors.firstName = "First name is required.";
  if (!values.lastName.trim()) errors.lastName = "Last name is required.";
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.yearsOfExperience && Number(values.yearsOfExperience) < 0) {
    errors.yearsOfExperience = "Experience cannot be negative.";
  }
  if (values.expectedSalary && Number(values.expectedSalary) < 0) {
    errors.expectedSalary = "Expected salary cannot be negative.";
  }
  if (values.coverLetter.length > 5000) {
    errors.coverLetter = "Cover letter must be 5000 characters or fewer.";
  }
  if (!values.resume) {
    errors.resume = "Resume is required.";
  } else {
    const extension = values.resume.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      errors.resume = "Only PDF and DOCX resumes are allowed.";
    } else if (values.resume.size > MAX_RESUME_SIZE) {
      errors.resume = "Resume must be 10 MB or smaller.";
    }
  }
  return errors;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
