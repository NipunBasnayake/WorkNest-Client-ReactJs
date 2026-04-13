import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorBanner } from "@/components/common/AppUI";
import { getTenantSettings, updateTenantPreferences } from "@/modules/settings/services/settingsService";
import type { PreferenceSettings, ThemePreference } from "@/modules/settings/types";

export function AppSettingsPreferencesPage() {
  usePageMeta({ title: "Settings - Preferences", breadcrumb: ["Workspace", "Settings", "Preferences"] });
  const { setTheme } = useTheme();

  const [values, setValues] = useState<PreferenceSettings>({
    theme: "system",
    emailNotifications: true,
    pushNotifications: true,
    dailyDigest: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getTenantSettings()
      .then((settings) => setValues(settings.preferences))
      .catch(() => setError("Unable to load preference settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const next = await updateTenantPreferences(values);
      applyThemePreference(next.theme, setTheme);
      setMessage("Preferences saved.");
    } catch {
      setError("Unable to save preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      {message && (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(16,185,129,0.25)", backgroundColor: "rgba(16,185,129,0.08)", color: "#10b981" }}>
          {message}
        </div>
      )}

      <SectionCard title="Interface Preferences" subtitle="These preferences are saved locally on this browser until backend preference APIs are available.">
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed px-3 py-2 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
              Local persistence scope: current device and browser only.
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="settings-theme" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Theme
              </label>
              <AppSelect
                id="settings-theme"
                value={values.theme}
                onChange={(event) => setValues((prev) => ({ ...prev, theme: event.target.value as ThemePreference }))}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </AppSelect>
            </div>

            <div className="space-y-2">
              <ToggleRow
                label="Email notifications"
                checked={values.emailNotifications}
                onChange={(checked) => setValues((prev) => ({ ...prev, emailNotifications: checked }))}
              />
              <ToggleRow
                label="Push notifications"
                checked={values.pushNotifications}
                onChange={(checked) => setValues((prev) => ({ ...prev, pushNotifications: checked }))}
              />
              <ToggleRow
                label="Daily digest summary"
                checked={values.dailyDigest}
                onChange={(checked) => setValues((prev) => ({ ...prev, dailyDigest: checked }))}
              />
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function applyThemePreference(preference: ThemePreference, setTheme: (theme: "light" | "dark") => void) {
  if (preference === "light") {
    setTheme("light");
    return;
  }
  if (preference === "dark") {
    setTheme("dark");
    return;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}
