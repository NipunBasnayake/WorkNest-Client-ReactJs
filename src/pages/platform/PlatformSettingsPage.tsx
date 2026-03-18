import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorBanner } from "@/components/common/AppUI";
import { getPlatformSettings, updatePlatformSettings } from "@/modules/settings/services/settingsService";
import type { PlatformSettings } from "@/modules/settings/types";

export function PlatformSettingsPage() {
  usePageMeta({ title: "Platform Settings", breadcrumb: ["Platform", "Settings"] });

  const [values, setValues] = useState<PlatformSettings>({
    platformName: "",
    supportEmail: "",
    maintenanceMode: false,
    auditLogsRetentionDays: 90,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getPlatformSettings()
      .then(setValues)
      .catch(() => setError("Unable to load platform settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updatePlatformSettings(values);
      setMessage("Platform settings saved.");
    } catch {
      setError("Unable to save platform settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="Platform Settings"
        description="Configure platform admin preferences (currently stored locally in this browser)."
      />

      {error && <ErrorBanner message={error} />}
      {message && (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(16,185,129,0.25)", backgroundColor: "rgba(16,185,129,0.08)", color: "#10b981" }}>
          {message}
        </div>
      )}

      <SectionCard title="Platform Configuration" subtitle="No backend platform-settings endpoint is exposed yet; values below are local-only.">
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed px-3 py-2 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
              Local persistence scope: current device and browser only.
            </div>

            <Input
              id="platform-name"
              label="Platform Name"
              value={values.platformName}
              onChange={(event) => setValues((prev) => ({ ...prev, platformName: event.target.value }))}
            />
            <Input
              id="platform-email"
              label="Support Email"
              type="email"
              value={values.supportEmail}
              onChange={(event) => setValues((prev) => ({ ...prev, supportEmail: event.target.value }))}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                <span>Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={values.maintenanceMode}
                  onChange={(event) => setValues((prev) => ({ ...prev, maintenanceMode: event.target.checked }))}
                />
              </label>

              <Input
                id="platform-retention"
                label="Audit Log Retention (days)"
                type="number"
                min={1}
                value={String(values.auditLogsRetentionDays)}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, auditLogsRetentionDays: Number(event.target.value) || 1 }))
                }
              />
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Platform Settings"}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
