import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  KeyRound,
  Mail,
  Phone,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/common/Input";
import { AvatarUploadField } from "@/components/common/AvatarUploadField";
import { Button } from "@/components/common/Button";
import { InlineAlert } from "@/components/common/InlineAlert";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SemanticBadge } from "@/components/common/SemanticBadge";
import { updateTenantPassword, updateTenantProfile } from "@/modules/settings/services/settingsService";
import { useAuthStore } from "@/store/authStore";
import { getMyEmployeeProfile, getMyEmployeeSkills } from "@/modules/employees/services/employeeService";
import { toEmployeeViewModel } from "@/modules/employees/utils/employeeMapper";
import type { ProfileSettings } from "@/modules/settings/types";
import type { EmployeeSkill, EmployeeViewModel } from "@/modules/employees/types";
import { validatePasswordStrength } from "@/modules/auth/passwordValidation";
import { deleteMyEmployeeAvatarApi, uploadMyEmployeeAvatarApi } from "@/services/api/employeeApi";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";
import { getErrorMessage } from "@/utils/errorHandler";

interface ProfileValidation {
  fullName?: string;
  title?: string;
  phone?: string;
}

function validateProfile(values: ProfileSettings): ProfileValidation {
  const errors: ProfileValidation = {};
  const nameParts = values.fullName.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length < 2) errors.fullName = "Enter both your first and last name.";
  if (values.fullName.trim().length > 200) errors.fullName = "Full name must be 200 characters or fewer.";
  if (values.title.trim().length > 120) errors.title = "Job title must be 120 characters or fewer.";
  if ((values.phone ?? "").trim().length > 30) errors.phone = "Phone number must be 30 characters or fewer.";
  if (values.phone?.trim() && !/^[0-9+()\-\s]*$/.test(values.phone.trim())) {
    errors.phone = "Use digits, spaces, and +()- symbols only.";
  }
  return errors;
}

export function AppSettingsProfilePage() {
  usePageMeta({ title: "Settings - Profile", breadcrumb: ["Workspace", "Settings", "Profile"] });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [values, setValues] = useState<ProfileSettings>(() => ({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    title: "",
    phone: "",
    avatarUrl: user?.avatarUrl,
    avatar: null,
  }));
  const [savedValues, setSavedValues] = useState<ProfileSettings | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeViewModel | null>(null);
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getMyEmployeeProfile(),
      getMyEmployeeSkills().catch(() => []),
    ])
      .then(([employee, loadedSkills]) => {
        if (!active) return;
        const mapped = toEmployeeViewModel(employee);
        const loaded: ProfileSettings = {
          fullName: mapped.displayName,
          email: mapped.email,
          title: mapped.position || mapped.designation || "",
          phone: mapped.phone || "",
          avatarUrl: mapped.avatarUrl,
          avatar: null,
        };
        setValues(loaded);
        setSavedValues(loaded);
        setEmployeeProfile(mapped);
        setSkills(loadedSkills);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError, "Unable to load your employee profile."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const profileErrors = useMemo(() => validateProfile(values), [values]);
  const profileDirty = Boolean(savedValues) && (
    values.fullName.trim() !== savedValues?.fullName.trim()
    || values.title.trim() !== savedValues?.title.trim()
    || (values.phone ?? "").trim() !== (savedValues?.phone ?? "").trim()
  );
  const passwordError = newPassword ? validatePasswordStrength(newPassword) : null;
  const confirmationError = confirmPassword && newPassword !== confirmPassword
    ? "Password confirmation does not match."
    : null;

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  async function handleSave() {
    setProfileSubmitted(true);
    clearFeedback();
    if (Object.keys(profileErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateTenantProfile(values);
      const merged = { ...values, ...updated, avatarUrl: values.avatarUrl, avatar: null };
      setValues(merged);
      setSavedValues(merged);
      setEmployeeProfile((previous) => previous ? {
        ...previous,
        displayName: merged.fullName,
        position: merged.title,
        designation: merged.title,
        phone: merged.phone,
      } : previous);
      if (user) setUser({ ...user, name: merged.fullName, email: merged.email, avatarUrl: merged.avatarUrl });
      await invalidateWorkflowQueries(queryClient, ["employees", "settings"]);
      setProfileSubmitted(false);
      setMessage("Your profile details were saved successfully.");
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save your profile details."));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword() {
    setPasswordSubmitted(true);
    clearFeedback();
    if (passwordError || !newPassword || newPassword !== confirmPassword) return;

    setUpdatingPassword(true);
    try {
      await updateTenantPassword(newPassword.trim());
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSubmitted(false);
      setMessage("Your password was updated successfully.");
    } catch (passwordUpdateError: unknown) {
      setError(getErrorMessage(passwordUpdateError, "Unable to update your password."));
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleAvatarUpload(file: File, options: ImageUploadRequestOptions) {
    clearFeedback();
    const result = await uploadMyEmployeeAvatarApi(file, options);
    const avatarUrl = result.variants?.["128"] ?? result.avatarUrl ?? undefined;
    setValues((previous) => ({ ...previous, avatarUrl, avatar: null }));
    setSavedValues((previous) => previous ? { ...previous, avatarUrl, avatar: null } : previous);
    setEmployeeProfile((previous) => previous ? { ...previous, avatarUrl } : previous);
    if (user) setUser({ ...user, avatarUrl });
    await invalidateWorkflowQueries(queryClient, [
      "employees",
      "settings",
      "teams",
      "projects",
      "tasks",
      "announcements",
      "notifications",
    ]);
    setMessage("Your profile picture is now updated across the workspace.");
  }

  async function handleAvatarRemove() {
    clearFeedback();
    await deleteMyEmployeeAvatarApi();
    setValues((previous) => ({ ...previous, avatarUrl: undefined, avatar: null }));
    setSavedValues((previous) => previous ? { ...previous, avatarUrl: undefined, avatar: null } : previous);
    setEmployeeProfile((previous) => previous ? { ...previous, avatarUrl: undefined } : previous);
    if (user) setUser({ ...user, avatarUrl: undefined });
    await invalidateWorkflowQueries(queryClient, [
      "employees",
      "settings",
      "teams",
      "projects",
      "tasks",
      "announcements",
      "notifications",
    ]);
    setMessage("Your profile picture was removed. Initials will be used instead.");
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="My profile"
        description="Manage the identity, photo, and security details used throughout your company workspace."
        status={employeeProfile ? <SemanticBadge label={String(employeeProfile.status || "ACTIVE")} variant={employeeProfile.status === "inactive" ? "neutral" : "success"} showDot /> : undefined}
      />

      <div className="space-y-3" aria-live="polite">
        {error ? <InlineAlert tone="error" message={error} /> : null}
        {message ? <InlineAlert tone="success" message={message} /> : null}
      </div>

      {loading ? <ProfileSettingsSkeleton /> : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <SectionCard
              title="Personal information"
              subtitle="Keep your employee identity accurate for shared workspace activity."
            >
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    id="settings-name"
                    label="Full name"
                    autoComplete="name"
                    value={values.fullName}
                    error={profileSubmitted ? profileErrors.fullName : undefined}
                    onChange={(event) => setValues((previous) => ({ ...previous, fullName: event.target.value }))}
                  />
                  <Input
                    id="settings-title"
                    label="Job title"
                    autoComplete="organization-title"
                    value={values.title}
                    error={profileSubmitted ? profileErrors.title : undefined}
                    onChange={(event) => setValues((previous) => ({ ...previous, title: event.target.value }))}
                  />
                  <Input
                    id="settings-phone"
                    label="Phone"
                    type="tel"
                    autoComplete="tel"
                    value={values.phone ?? ""}
                    error={profileSubmitted ? profileErrors.phone : undefined}
                    placeholder="+94 77 123 4567"
                    onChange={(event) => setValues((previous) => ({ ...previous, phone: event.target.value }))}
                  />
                  <Input
                    id="settings-email"
                    label="Email"
                    type="email"
                    value={values.email}
                    disabled
                    onChange={() => undefined}
                  />
                </div>
                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-default)" }}>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {profileDirty ? "You have unsaved profile changes." : "Your profile details are up to date."}
                  </p>
                  <Button type="button" loading={saving} disabled={!profileDirty} onClick={() => void handleSave()}>
                    Save changes
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Password and sign-in"
              subtitle="Choose a strong password that you do not use for another account."
            >
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    id="settings-password"
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    error={passwordSubmitted ? (passwordError ?? (!newPassword ? "Enter a new password." : undefined)) : undefined}
                    hint="Use at least 8 characters with a letter and a number."
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                  <Input
                    id="settings-password-confirm"
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    error={passwordSubmitted ? (confirmationError ?? (!confirmPassword ? "Confirm your new password." : undefined)) : undefined}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
                <div className="flex justify-end border-t pt-5" style={{ borderColor: "var(--border-default)" }}>
                  <Button type="button" variant="outline" loading={updatingPassword} disabled={!newPassword || !confirmPassword} onClick={() => void handleUpdatePassword()}>
                    <KeyRound size={16} /> Update password
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-6">
            <SectionCard title="Profile picture" subtitle="Used in navigation, collaboration, and activity views." variant="dense">
              <AvatarUploadField
                name={values.fullName}
                email={values.email}
                src={values.avatarUrl}
                disabled={saving}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
              />
            </SectionCard>

            <SectionCard title="Employee record" subtitle="Managed workplace information." variant="dense">
              {employeeProfile ? (
                <div className="space-y-4">
                  <ProfileFact icon={<BadgeCheck size={16} />} label="Employee code" value={employeeProfile.employeeCode || "Not assigned"} />
                  <ProfileFact icon={<BriefcaseBusiness size={16} />} label="Role" value={String(employeeProfile.role || "EMPLOYEE").replaceAll("_", " ")} />
                  <ProfileFact icon={<Building2 size={16} />} label="Department" value={employeeProfile.department || "Not assigned"} />
                  <ProfileFact icon={<Phone size={16} />} label="Phone" value={employeeProfile.phone || "Not provided"} />
                  <ProfileFact icon={<Mail size={16} />} label="Work email" value={employeeProfile.email} />

                  <div className="border-t pt-4" style={{ borderColor: "var(--border-default)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Skills</p>
                    {skills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span key={skill.id} className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: "var(--brand-border)", background: "var(--brand-soft)", color: "var(--color-primary-700)" }}>
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-5" style={{ color: "var(--text-secondary)" }}>No skills have been assigned yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>Employee details are unavailable for this account.</p>
              )}
            </SectionCard>
          </aside>
        </div>
      )}
    </div>
  );
}

function ProfileFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0" style={{ color: "var(--brand-action)" }} aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

function ProfileSettingsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" aria-busy="true" aria-label="Loading profile settings">
      <div className="space-y-6">
        {[280, 230].map((height) => (
          <div key={height} className="animate-pulse rounded-2xl border" style={{ height, borderColor: "var(--border-default)", background: "var(--bg-surface)" }} />
        ))}
      </div>
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-2xl border" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }} />
        <div className="h-80 animate-pulse rounded-2xl border" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }} />
      </div>
    </div>
  );
}
