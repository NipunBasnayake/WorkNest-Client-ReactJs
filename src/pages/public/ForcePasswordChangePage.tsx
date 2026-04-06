import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { changeRequiredPasswordApi } from "@/services/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { getErrorMessage } from "@/utils/errorHandler";

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const {
    passwordChangeRequired,
    passwordChangeChallenge,
    login,
    clearError,
    setPasswordChangeChallenge,
  } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!passwordChangeRequired || !passwordChangeChallenge) {
      navigate("/login", { replace: true });
    }
  }, [navigate, passwordChangeChallenge, passwordChangeRequired]);

  function validate(): boolean {
    const next: FormErrors = {};

    if (!currentPassword.trim()) next.currentPassword = "Current password is required.";
    if (!newPassword.trim()) next.newPassword = "New password is required.";
    else if (newPassword.length < 8) next.newPassword = "New password must be at least 8 characters.";
    if (!confirmPassword.trim()) next.confirmPassword = "Please confirm your new password.";
    else if (confirmPassword !== newPassword) next.confirmPassword = "Passwords do not match.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    setMessage(null);

    if (!passwordChangeChallenge) {
      setMessage("Password change session is missing. Please sign in again.");
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    try {
      await changeRequiredPasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
        email: passwordChangeChallenge.email,
        tenantKey: passwordChangeChallenge.tenantKey,
        challengeToken: passwordChangeChallenge.challengeToken,
      });

      await login({
        email: passwordChangeChallenge.email,
        password: newPassword,
        tenantKey: passwordChangeChallenge.tenantKey,
      });

      setPasswordChangeChallenge(null);
      const sessionType = window.localStorage.getItem("wn_session_type");
      navigate(sessionType === "platform" ? "/platform/dashboard" : "/app/dashboard", { replace: true });
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Unable to change password right now."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <div
        className="rounded-2xl border p-6"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="mb-5 flex items-start gap-3">
          <div
            className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Password Update Required
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              For security, you must change your password before accessing your workspace.
            </p>
          </div>
        </div>

        {message && (
          <div
            className="mb-4 rounded-xl border px-3 py-2.5 text-sm"
            style={{
              borderColor: "rgba(239,68,68,0.25)",
              backgroundColor: "rgba(239,68,68,0.06)",
              color: "#ef4444",
            }}
          >
            {message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            id="force-current-password"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={errors.currentPassword}
            autoComplete="current-password"
          />

          <Input
            id="force-new-password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={errors.newPassword}
            autoComplete="new-password"
          />

          <Input
            id="force-confirm-password"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? "Updating Password..." : (
              <>
                <KeyRound size={16} />
                Update Password
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}