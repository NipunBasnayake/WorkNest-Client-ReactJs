import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { CheckCircle2, FileText } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { getPublicApplicationStatus } from "@/modules/careers/services/publicApplicationsService";
import type { PublicApplicationResponse, PublicApplicationStatus } from "@/modules/careers/types";
import { formatPublicDate } from "@/modules/careers/utils";

interface LocationState {
  application?: PublicApplicationResponse;
}

export function ApplicationSuccessPage() {
  const { tenantSlug = "", referenceNumber = "" } = useParams();
  const location = useLocation();
  const initialApplication = (location.state as LocationState | null)?.application;
  const [application, setApplication] = useState<PublicApplicationResponse | PublicApplicationStatus | null>(initialApplication ?? null);
  const [loading, setLoading] = useState(!initialApplication);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const companyName = application?.company.companyName ?? "Company";
  const title = useMemo(() => `Application Submitted - ${companyName}`, [companyName]);

  useSeoMeta({
    title,
    description: "Your application has been submitted.",
    canonicalPath: tenantSlug && referenceNumber ? `/${tenantSlug}/applications/${referenceNumber}/success` : undefined,
  });

  useEffect(() => {
    let active = true;

    if (!referenceNumber || initialApplication) {
      return () => {
        active = false;
      };
    }

    getPublicApplicationStatus(tenantSlug, referenceNumber)
      .then((result) => {
        if (active) setApplication(result);
      })
      .catch(() => {
        if (active) setError("Application reference was not found.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialApplication, referenceNumber, retryKey, tenantSlug]);

  if (loading) {
    return (
      <PageContainer size="lg">
        <div className="h-80 animate-pulse rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }} />
      </PageContainer>
    );
  }

  if (error || !application) {
    return (
      <PageContainer size="lg" className="space-y-5">
        <ErrorBanner message={error ?? "Unable to load the submitted application."} onRetry={() => { setLoading(true); setError(null); setRetryKey((value) => value + 1); }} />
        <Button variant="secondary" to={`/${tenantSlug}/careers`}>Return to Careers</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg" className="space-y-7">
      <PageHeader
        title="Application Submitted"
        description="We'll contact you if your profile matches."
        status={<Badge variant="success">Submitted</Badge>}
      />

      <SectionCard>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#059669" }}>
            <CheckCircle2 size={30} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{application.vacancyTitle}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{application.company.companyName}</p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Reference Number" value={application.referenceNumber} />
              <Detail label="Submitted Date" value={formatPublicDate(application.submittedDate)} />
              {"status" in application && application.status ? <Detail label="Status" value={application.status.replaceAll("_", " ")} /> : null}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="primary" to={`/${tenantSlug}/careers`}>
                Return to Careers
              </Button>
              <Button variant="secondary" to={`/${tenantSlug}/careers/${application.jobSlug}`}>
                <FileText size={16} />
                View Vacancy
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}>
      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</dd>
    </div>
  );
}
