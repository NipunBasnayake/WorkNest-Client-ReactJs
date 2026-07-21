import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, ArrowLeft, BarChart3, BriefcaseBusiness, Building2, Calendar, Database, FileClock, FileText, Key, ListTodo, Mail, Shield, Users } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformTenantDetailQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { SectionCard } from "@/components/common/SectionCard";
import { formatDate, formatDateTime, formatRelativeTime } from "@/utils/formatting";
import { getErrorMessage } from "@/utils/errorHandler";
import { Button } from "@/components/common/Button";
import { PlatformStatusBadge } from "@/modules/platform/components/PlatformStatusBadge";
import { TenantActionsMenu } from "@/modules/platform/components/TenantActionsMenu";
import { Input } from "@/components/common/Input";
import { BrandColorPicker, BrandPreview } from "@/features/branding/BrandingEditor";
import { isValidBrandColor } from "@/features/branding/colorTokens";
import { getPlatformTenantBranding, updatePlatformTenantBranding } from "@/features/branding/brandingService";
import type { TenantBranding } from "@/features/branding/types";

export function TenantDetailPage() {
  const { tenantKey } = useParams<{ tenantKey: string }>();
  usePageMeta({ title: tenantKey ?? "Tenant Detail", breadcrumb: ["Platform", "Tenants", tenantKey ?? ""] });
  const { data: tenant, error, isLoading, refetch } = usePlatformTenantDetailQuery(tenantKey, true);
  const errorMessage = error ? getErrorMessage(error, "Failed to load tenant details.") : null;

  if (isLoading) return <SectionCard><LoadingSkeleton lines={12} /></SectionCard>;

  return (
    <div className="space-y-6">
      <Link to="/platform/tenants" className="inline-flex items-center gap-2 text-sm no-underline transition-colors hover:text-primary-500" style={{ color: "var(--text-secondary)" }}><ArrowLeft size={16} />Back to tenant management</Link>
      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}
      {!errorMessage && !tenant ? <EmptyState title="Tenant not found" description="The requested tenant does not exist or is no longer available." /> : null}

      {!errorMessage && tenant ? (
        <>
          <div className="rounded-2xl border p-6 sm:p-8" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", borderTop: "3px solid var(--color-primary-500)" }}>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-purple-500/10 text-2xl font-bold text-purple-600">{(tenant.companyName ?? tenant.tenantKey ?? "?")[0].toUpperCase()}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{tenant.companyName}</h1>
                    <PlatformStatusBadge status={tenant.status} />
                  </div>
                  <p className="mt-1 font-mono text-sm" style={{ color: "var(--text-tertiary)" }}>{tenant.tenantKey}</p>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Registered {formatDate(tenant.createdAt)} · Last activity {formatRelativeTime(tenant.lastActivityAt)}</p>
                </div>
              </div>
              <TenantActionsMenu tenant={tenant} buttonLabel="Actions" />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Company information" subtitle="Master-database identity and tenant routing information.">
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldRow icon={<Building2 size={16} />} label="Company name" value={tenant.companyName} />
                <FieldRow icon={<Key size={16} />} label="Tenant key" value={tenant.tenantKey} mono />
                <FieldRow icon={<Database size={16} />} label="Database" value={tenant.databaseName ?? "Not available"} mono />
                <FieldRow icon={<Calendar size={16} />} label="Registered" value={formatDateTime(tenant.createdAt)} />
                <FieldRow icon={<Activity size={16} />} label="Last platform update" value={formatDateTime(tenant.updatedAt)} />
                <FieldRow icon={<Shield size={16} />} label="Lifecycle status" value={<PlatformStatusBadge status={tenant.status} />} />
              </div>
            </SectionCard>

            <SectionCard title="Company administrator" subtitle="Primary tenant administrator identity and engagement.">
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldRow icon={<Users size={16} />} label="Administrator" value={tenant.adminName ?? "Not assigned"} />
                <FieldRow icon={<Mail size={16} />} label="Email" value={tenant.adminEmail ?? "Not available"} />
                <FieldRow icon={<Activity size={16} />} label="Last login" value={tenant.lastLoginAt ? formatDateTime(tenant.lastLoginAt) : "Never logged in"} />
                <FieldRow icon={<Calendar size={16} />} label="Login recency" value={formatRelativeTime(tenant.lastLoginAt)} />
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Workspace adoption" subtitle="Live operational counts from the tenant database; unavailable data is never estimated.">
            {tenant.usageAvailable ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <UsageMetric icon={<Users size={20} />} label="Employees" value={tenant.employeeCount ?? 0} color="#9332ea" />
                <UsageMetric icon={<BriefcaseBusiness size={20} />} label="Projects" value={tenant.projectCount ?? 0} color="#2563eb" />
                <UsageMetric icon={<Building2 size={20} />} label="Teams" value={tenant.teamCount ?? 0} color="#059669" />
                <UsageMetric icon={<ListTodo size={20} />} label="Tasks" value={tenant.taskCount ?? 0} color="#d97706" />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: "var(--border-default)" }}>
                <Database size={24} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Live usage unavailable</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Usage is not queried for inaccessible or non-active tenant databases.</p>
              </div>
            )}
          </SectionCard>

          <PlatformBrandingCard tenantKey={tenant.tenantKey} onCompanyChanged={() => void refetch()} />

          <SectionCard title="Operational drill-down" subtitle="Open platform-wide tools already filtered to this company.">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" to={`/platform/analytics?tenant=${encodeURIComponent(tenant.tenantKey)}`}><BarChart3 size={16} />View analytics</Button>
              <Button variant="outline" size="sm" to={`/platform/audit-logs?tenant=${encodeURIComponent(tenant.tenantKey)}`}><FileClock size={16} />Audit logs</Button>
              <Button variant="outline" size="sm" to={`/platform/reports?tenant=${encodeURIComponent(tenant.tenantKey)}`}><FileText size={16} />Reports</Button>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

function PlatformBrandingCard({ tenantKey, onCompanyChanged }: { tenantKey: string; onCompanyChanged: () => void }) {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPlatformTenantBranding(tenantKey)
      .then(setBranding)
      .catch((loadError: unknown) => setError(getErrorMessage(loadError, "Unable to load tenant branding.")))
      .finally(() => setLoading(false));
  }, [tenantKey]);

  async function saveBranding() {
    if (!branding || !branding.companyName.trim() || !isValidBrandColor(branding.primaryColor)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updatePlatformTenantBranding(tenantKey, {
        companyName: branding.companyName.trim(),
        primaryColor: branding.primaryColor.toUpperCase(),
        brandingVersion: branding.brandingVersion,
      });
      setBranding(updated);
      setMessage("Tenant branding saved.");
      onCompanyChanged();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save tenant branding."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Tenant branding" subtitle="Platform administrators can manage the tenant's canonical company identity.">
      {error ? <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600">{message}</div> : null}
      {loading || !branding ? (
        <LoadingSkeleton lines={6} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <Input id="platform-brand-company" label="Company name" value={branding.companyName} onChange={(event) => setBranding((previous) => previous ? { ...previous, companyName: event.target.value } : previous)} />
            <BrandColorPicker value={branding.primaryColor} onChange={(primaryColor) => setBranding((previous) => previous ? { ...previous, primaryColor } : previous)} disabled={saving} />
            <div className="flex justify-end">
              <Button onClick={() => void saveBranding()} disabled={saving || !branding.companyName.trim() || !isValidBrandColor(branding.primaryColor)}>
                {saving ? "Saving..." : "Save Branding"}
              </Button>
            </div>
          </div>
          <BrandPreview branding={branding} />
        </div>
      )}
    </SectionCard>
  );
}

function FieldRow({ icon, label, value, mono = false }: { icon: ReactNode; label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4" style={{ background: "var(--bg-muted)", borderColor: "var(--border-default)" }}>
      <span className="mt-0.5 shrink-0 text-purple-600">{icon}</span>
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <div className={`truncate text-sm font-medium ${mono ? "font-mono" : ""}`} style={{ color: "var(--text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}

function UsageMetric({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ color, background: `${color}12` }}>{icon}</span>
      <div><p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p></div>
    </div>
  );
}
