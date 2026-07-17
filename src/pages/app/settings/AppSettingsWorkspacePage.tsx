import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { FileUploadField } from "@/components/common/FileUploadField";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorBanner } from "@/components/common/AppUI";
import { getTenantSettings, updateTenantWorkspace } from "@/modules/settings/services/settingsService";
import type { WorkspaceSettings } from "@/modules/settings/types";

export function AppSettingsWorkspacePage() {
  usePageMeta({ title: "Settings - Workspace", breadcrumb: ["Workspace", "Settings", "Workspace"] });
  const [values, setValues] = useState<WorkspaceSettings>({
    workspaceName: "",
    tenantKey: "",
    status: "ACTIVE",
    createdAt: "",
    dataSource: "inferred",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getTenantSettings()
      .then((settings) => setValues(settings.workspace))
      .catch(() => setError("Unable to load workspace settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      setValues(await updateTenantWorkspace(values));
      setMessage("Workspace settings saved.");
    } catch {
      setError("Unable to save workspace settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      {message ? <div className="rounded-xl border px-4 py-3 text-sm text-emerald-600">{message}</div> : null}

      <SectionCard title="Workspace Information" subtitle="Tenant identity values are backend-backed where available and read-only in this module.">
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        ) : (
          <div className="space-y-4">
            <Input
              id="workspace-name"
              label="Workspace Name"
              value={values.workspaceName}
              onChange={(event) => setValues((prev) => ({ ...prev, workspaceName: event.target.value }))}
            />

            <FileUploadField
              id="workspace-logo"
              label="Company Logo"
              hint="Used across workspace branding and public careers pages."
              folder="companies/logos"
              category="WORKSPACE_LOGO"
              kind="image"
              disabled={saving}
              value={values.logo ? [values.logo] : []}
              onChange={(assets) => {
                const logo = assets[0] ?? null;
                setValues((previous) => ({ ...previous, logo, logoUrl: logo?.url }));
              }}
            />

            <Input
              id="workspace-key"
              label="Workspace Key"
              value={values.tenantKey}
              disabled
              hint="Tenant key is read-only."
              onChange={() => undefined}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input id="workspace-status" label="Status" value={values.status} disabled onChange={() => undefined} />
              <Input id="workspace-created" label="Created At" value={values.createdAt || "Unavailable"} disabled onChange={() => undefined} />
            </div>

            {values.databaseName && (
              <Input id="workspace-database" label="Database Name" value={values.databaseName} disabled onChange={() => undefined} />
            )}

            <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
              Data source: {values.dataSource === "backend" ? "Backend tenant registry" : "Inferred from authenticated tenant context"}.
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => void handleSave()} disabled={saving || !values.workspaceName.trim()}>
                {saving ? "Saving..." : "Save Workspace"}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
