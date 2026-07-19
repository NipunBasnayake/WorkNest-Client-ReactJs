import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorBanner } from "@/components/common/AppUI";
import { getTenantSettings } from "@/modules/settings/services/settingsService";
import type { WorkspaceSettings } from "@/modules/settings/types";
import {
  deleteTenantLogo,
  getEditableTenantBranding,
  updateTenantBranding,
  uploadTenantLogo,
} from "@/features/branding/brandingService";
import { BrandColorPicker, BrandLogoField, BrandPreview } from "@/features/branding/BrandingEditor";
import { isValidBrandColor } from "@/features/branding/colorTokens";
import type { TenantBranding } from "@/features/branding/types";
import { getErrorMessage } from "@/utils/errorHandler";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";

export function AppSettingsWorkspacePage() {
  usePageMeta({ title: "Settings - Workspace", breadcrumb: ["Workspace", "Settings", "Workspace"] });
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] = useState<WorkspaceSettings>({
    workspaceName: "",
    tenantKey: "",
    status: "ACTIVE",
    createdAt: "",
    dataSource: "inferred",
  });
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTenantSettings(), getEditableTenantBranding()])
      .then(([settings, loadedBranding]) => {
        setWorkspace(settings.workspace);
        setBranding(loadedBranding);
      })
      .catch((loadError: unknown) => setError(getErrorMessage(loadError, "Unable to load workspace branding.")))
      .finally(() => setLoading(false));
  }, []);

  function refreshBrandingConsumers(updated: TenantBranding) {
    queryClient.setQueriesData(
      { queryKey: ["tenant-branding", "tenant"] },
      updated
    );
    void queryClient.invalidateQueries({
      queryKey: ["tenant-branding", "public", updated.tenantSlug ?? ""],
      refetchType: "none",
    });
  }

  async function handleSave() {
    if (!branding || !branding.companyName.trim() || !isValidBrandColor(branding.primaryColor)) {
      setError("Enter a company name and a valid #RRGGBB primary color.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateTenantBranding({
        companyName: branding.companyName.trim(),
        primaryColor: branding.primaryColor.toUpperCase(),
        brandingVersion: branding.brandingVersion,
      });
      setBranding(updated);
      setWorkspace((previous) => ({ ...previous, workspaceName: updated.companyName, dataSource: "backend" }));
      refreshBrandingConsumers(updated);
      setMessage("Workspace branding saved.");
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save workspace branding."));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File, options: ImageUploadRequestOptions) {
    if (!branding) return;
    const updated = await uploadTenantLogo(file, branding.brandingVersion, options);
    setBranding(updated);
    refreshBrandingConsumers(updated);
    setMessage("Company logo updated.");
  }

  async function handleLogoRemove() {
    if (!branding) return;
    const updated = await deleteTenantLogo(branding.brandingVersion);
    setBranding(updated);
    refreshBrandingConsumers(updated);
    setMessage("Company logo removed.");
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      {message ? <div className="rounded-xl border px-4 py-3 text-sm text-emerald-600" style={{ borderColor: "rgba(16,185,129,0.25)", backgroundColor: "rgba(16,185,129,0.08)" }}>{message}</div> : null}

      <SectionCard title="Workspace branding" subtitle="Manage the tenant identity used across the workspace, public careers pages, and reports.">
        {loading || !branding ? (
          <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-5">
              <Input
                id="workspace-name"
                label="Company name"
                value={branding.companyName}
                onChange={(event) => setBranding((previous) => previous ? { ...previous, companyName: event.target.value } : previous)}
              />
              <BrandColorPicker
                value={branding.primaryColor}
                onChange={(primaryColor) => setBranding((previous) => previous ? { ...previous, primaryColor } : previous)}
                disabled={saving}
              />
              <BrandLogoField branding={branding} onUpload={handleLogoUpload} onRemove={handleLogoRemove} disabled={saving} />
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => void handleSave()} disabled={saving || !branding.companyName.trim() || !isValidBrandColor(branding.primaryColor)}>
                  {saving ? "Saving..." : "Save Branding"}
                </Button>
              </div>
            </div>
            <BrandPreview branding={branding} />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Workspace information" subtitle="Routing and lifecycle values are read-only.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="workspace-key" label="Workspace Key" value={workspace.tenantKey} disabled hint="Tenant key is read-only." onChange={() => undefined} />
          <Input id="workspace-status" label="Status" value={workspace.status} disabled onChange={() => undefined} />
          <Input id="workspace-created" label="Created At" value={workspace.createdAt || "Unavailable"} disabled onChange={() => undefined} />
          {workspace.databaseName ? <Input id="workspace-database" label="Database Name" value={workspace.databaseName} disabled onChange={() => undefined} /> : null}
        </div>
      </SectionCard>
    </div>
  );
}
