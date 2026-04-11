import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { validatePasswordStrength } from "@/modules/auth/passwordValidation";
import { changeRequiredPasswordApi } from "@/services/api/authApi";
import { getErrorMessage } from "@/utils/errorHandler";
import type { SessionType } from "@/types";

interface PasswordTouched {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
}

const AUTH_ONLY_PATHS = [
  "/login",
  "/register",
  "/register-company",
  "/forgot-password",
  "/reset-password",
  "/force-password-change",
  "/session-expired",
];

function readFromLocationState(state: unknown): Location | undefined {
  if (!state || typeof state !== "object") return undefined;

  const candidate = state as { from?: unknown };
  if (!candidate.from || typeof candidate.from !== "object") return undefined;

  const from = candidate.from as Partial<Location>;
  if (typeof from.pathname !== "string" || !from.pathname.startsWith("/")) return undefined;

  return {
    ...from,
    pathname: from.pathname,
    search: typeof from.search === "string" ? from.search : "",
    hash: typeof from.hash === "string" ? from.hash : "",
    key: typeof from.key === "string" ? from.key : "",
    state: from.state,
  } as Location;
}

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function resolvePostPasswordChangePath(
  fromLocation: Location | undefined,
  sessionType: SessionType | null,
  tenantKey: string | null
): string {
  const fallback = sessionType === "platform"
    ? "/platform/dashboard"
    : tenantKey
      ? "/app/dashboard"
      : "/platform/dashboard";

  if (!fromLocation) return fallback;
  if (!fromLocation.pathname.startsWith("/") || isAuthOnlyPath(fromLocation.pathname)) return fallback;

  return `${fromLocation.pathname}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`;
}

function buildLoginPath(email?: string, tenantKey?: string | null): string {
  const params = new URLSearchParams();
  if (email?.trim()) params.set("email", email.trim());
  if (tenantKey?.trim()) params.set("tenant", tenantKey.trim());
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export function ForcePasswordChangePage() {
  usePageMeta({ title: "Password Update Required - WorkNest" });

  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    sessionType,
    error,
    clearError,
    passwordChangeRequired,
    passwordChangeChallenge,
    setPasswordChangeChallenge,
    completePasswordChange,
  } = useAuth();

  const challenge = passwordChangeChallenge;
  const fromLocation = useMemo(() => readFromLocationState(location.state), [location.state]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<PasswordTouched>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || passwordChangeRequired) return;
    navigate(
      resolvePostPasswordChangePath(fromLocation, sessionType, challenge?.tenantKey ?? null),
      { replace: true }
    );
  }, [challenge?.tenantKey, fromLocation, isAuthenticated, navigate, passwordChangeRequired, sessionType]);

  const currentPasswordError = useMemo(() => {
    if (!touched.currentPassword) return undefined;
    if (!currentPassword.trim()) return "Current password is required.";
    return undefined;
  }, [currentPassword, touched.currentPassword]);

  const newPasswordError = useMemo(() => {
    if (!touched.newPassword) return undefined;
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) return strengthError;
    if (currentPassword && currentPassword === newPassword) {
      return "New password must be different from the current password.";
    }
    return undefined;
  }, [currentPassword, newPassword, touched.newPassword]);

  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword) return undefined;
    if (!confirmPassword.trim()) return "Please confirm your new password.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return undefined;
  }, [confirmPassword, newPassword, touched.confirmPassword]);

  const forgotPasswordHref = useMemo(() => {
    const params = new URLSearchParams();
    if (challenge?.email?.trim()) params.set("email", challenge.email.trim());
    if (challenge?.tenantKey?.trim()) params.set("tenant", challenge.tenantKey.trim());
    const query = params.toString();
    return query ? `/forgot-password?${query}` : "/forgot-password";
  }, [challenge?.email, challenge?.tenantKey]);

  const loginPath = useMemo(
    () => buildLoginPath(challenge?.email, challenge?.tenantKey),
    [challenge?.email, challenge?.tenantKey]
  );

  const displayError = formError || error;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    setFormError(null);
    setSuccessMessage(null);
    clearError();

    if (!challenge) {
      setFormError("Your password update session is no longer active. Please sign in again.");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (newPasswordError || confirmPasswordError) {
      setFormError("Please resolve the validation issues before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await changeRequiredPasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
        email: challenge.email,
        tenantKey: challenge.tenantKey,
        challengeToken: challenge.challengeToken,
      });

      await completePasswordChange(result);

      if (result.tokens) {
        const nextSessionType = useAuthStore.getState().sessionType;
        navigate(
          resolvePostPasswordChangePath(fromLocation, nextSessionType, challenge.tenantKey),
          { replace: true }
        );
        return;
      }

      const nextState = fromLocation
        ? { message: "Password updated. Please sign in with your new password.", from: fromLocation }
        : { message: "Password updated. Please sign in with your new password." };
      navigate(loginPath, { replace: true, state: nextState });
    } catch (submitError: unknown) {
      setFormError(getErrorMessage(submitError, "Unable to update password right now. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleUseAnotherAccount() {
    setPasswordChangeChallenge(null);
    clearError();
    navigate(loginPath, { replace: true });
  }

  if (!challenge) {
    return (
      <AuthPageFrame
        title="Password Update Required"
        description="This step is only available immediately after a password-change-required sign-in challenge."
      >
        <div className="space-y-4">
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(245,158,11,0.35)",
              backgroundColor: "rgba(245,158,11,0.08)",
              color: "#d97706",
            }}
          >
            Your challenge token is missing or expired. Sign in again to continue.
          </div>

          <Button type="button" className="w-full" onClick={() => navigate("/login", { replace: true })}>
            Back To Login
          </Button>
        </div>
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title="Update Your Password"
      description="For your account security, you need to set a new password before continuing into WorkNest."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {displayError ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(239,68,68,0.35)",
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#ef4444",
            }}
          >
            {displayError}
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(16,185,129,0.35)",
              backgroundColor: "rgba(16,185,129,0.08)",
              color: "#10b981",
            }}
          >
            {successMessage}
          </div>
        ) : null}

        <div
          className="rounded-xl border px-4 py-3 text-xs"
          style={{
            borderColor: "rgba(147,50,234,0.22)",
            backgroundColor: "rgba(147,50,234,0.08)",
            color: "var(--text-secondary)",
          }}
        >
          <div className="flex items-start gap-2">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary-600)" }} />
            <div>
              <p>
                Signed in as <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{challenge.email || "your account"}</span>
                {challenge.tenantKey ? (
                  <>
                    {" "}in workspace <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{challenge.tenantKey}</span>.
                  </>
                ) : "."}
              </p>
              <p className="mt-1">Use your current temporary password once, then choose a stronger replacement.</p>
            </div>
          </div>
        </div>

        <Input
          id="force-password-current"
          type={showCurrentPassword ? "text" : "password"}
          label="Current Password"
          placeholder="Enter your current password"
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setFormError(null);
            if (error) clearError();
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, currentPassword: true }))}
          error={currentPasswordError}
          autoComplete="current-password"
          required
          endAdornment={
            <button
              type="button"
              className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          id="force-password-new"
          type={showNewPassword ? "text" : "password"}
          label="New Password"
          placeholder="At least 8 chars, include letter and number"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setFormError(null);
            if (error) clearError();
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
          error={newPasswordError}
          autoComplete="new-password"
          required
          endAdornment={
            <button
              type="button"
              className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
              onClick={() => setShowNewPassword((prev) => !prev)}
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          id="force-password-confirm"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setFormError(null);
            if (error) clearError();
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
          error={confirmPasswordError}
          autoComplete="new-password"
          required
          endAdornment={
            <button
              type="button"
              className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Button type="submit" disabled={submitting} className="w-full" size="lg">
          <KeyRound size={16} />
          {submitting ? "Updating Password..." : "Update Password"}
        </Button>

        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
          <button
            type="button"
            className="font-medium text-primary-600 transition hover:text-primary-700 hover:underline"
            onClick={handleUseAnotherAccount}
          >
            Use another account
          </button>
          <Link to={forgotPasswordHref} className="font-medium text-primary-600 transition hover:text-primary-700 hover:underline">
            Forgot password instead?
          </Link>
        </div>
      </form>
    </AuthPageFrame>
  );
}
