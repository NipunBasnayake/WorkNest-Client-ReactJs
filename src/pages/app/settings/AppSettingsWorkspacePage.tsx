import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Input } from "@/components/common/Input";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorBanner } from "@/components/common/AppUI";
import { getTenantSettings } from "@/modules/settings/services/settingsService";
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

  useEffect(() => {
    getTenantSettings()
      .then((settings) => setValues(settings.workspace))
      .catch(() => setError("Unable to load workspace settings."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

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
          </div>
        )}
      </SectionCard>
    </div>
  );
}
