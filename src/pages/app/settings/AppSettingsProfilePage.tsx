import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorBanner } from "@/components/common/AppUI";
import { getTenantSettings, updateTenantPassword, updateTenantProfile } from "@/modules/settings/services/settingsService";
import { useAuthStore } from "@/store/authStore";
import type { ProfileSettings } from "@/modules/settings/types";

export function AppSettingsProfilePage() {
  usePageMeta({ title: "Settings - Profile", breadcrumb: ["Workspace", "Settings", "Profile"] });
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);

  const [values, setValues] = useState<ProfileSettings>({
    fullName: "",
    email: "",
    title: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getTenantSettings()
      .then((settings) => {
        setValues({
          fullName: settings.profile.fullName || user?.name || "",
          email: settings.profile.email || user?.email || "",
          title: settings.profile.title,
        });
      })
      .catch(() => setError("Unable to load profile settings."))
      .finally(() => setLoading(false));
  }, [user?.email, user?.name]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateTenantProfile(values);
      setValues(updated);
      if (user) {
        setUser({ ...user, name: updated.fullName, email: updated.email });
      }
      setMessage("Profile settings saved.");
    } catch {
      setError("Unable to save profile settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword() {
    setError(null);
    setMessage(null);

    if (newPassword.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await updateTenantPassword(newPassword.trim());
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
    } catch {
      setError("Unable to update password.");
    } finally {
      setUpdatingPassword(false);
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

      <SectionCard title="Profile Details" subtitle="Update your account identity details.">
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input id="settings-name" label="Full Name" value={values.fullName} onChange={(e) => setValues((prev) => ({ ...prev, fullName: e.target.value }))} />
              <Input id="settings-title" label="Job Title" value={values.title} onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <Input id="settings-email" label="Email" type="email" value={values.email} disabled hint="Email changes are managed by your authentication account." onChange={() => undefined} />
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Password" subtitle="Update your account password using the workspace profile endpoint.">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            <Shield size={14} />
            Security controls
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              id="settings-password"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              hint="Minimum 8 characters."
            />
            <Input
              id="settings-password-confirm"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleUpdatePassword} disabled={updatingPassword}>
              {updatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
