import { useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ArrowRight } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { validatePasswordStrength } from "@/modules/auth/passwordValidation";
import { resetPasswordApi } from "@/services/api/authApi";
import { getErrorMessage } from "@/utils/errorHandler";

interface ResetTouched {
  token: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export function ResetPasswordPage() {
  usePageMeta({ title: "Reset Password - WorkNest" });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token: tokenParam } = useParams<{ token?: string }>();
  const [token, setToken] = useState(tokenParam ?? searchParams.get("token") ?? searchParams.get("code") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<ResetTouched>({
    token: false,
    password: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tokenError = useMemo(() => {
    if (!touched.token) return undefined;
    if (!token.trim()) return "Reset token is required.";
    return undefined;
  }, [token, touched.token]);

  const passwordError = useMemo(() => {
    if (!touched.password) return undefined;
    return validatePasswordStrength(password) ?? undefined;
  }, [password, touched.password]);

  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword) return undefined;
    if (!confirmPassword.trim()) return "Please confirm your new password.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return undefined;
  }, [confirmPassword, password, touched.confirmPassword]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ token: true, password: true, confirmPassword: true });
    setError(null);
    setSuccessMessage(null);

    if (!token.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (passwordError || confirmPasswordError) {
      setError("Please resolve the validation issues before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordApi(token.trim(), password, confirmPassword);
      setSuccessMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { message: "Password reset successful. Sign in with your new password." },
        });
      }, 1200);
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, "Unable to reset password. Please verify your token and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageFrame
      title="Set a new password"
      description="Enter your reset token and choose a new password for your WorkNest account."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(239,68,68,0.35)",
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#ef4444",
            }}
          >
            {error}
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

        <Input
          id="reset-password-token"
          type="text"
          label="Reset Token"
          placeholder="Paste your reset token"
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
            if (error) setError(null);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, token: true }))}
          error={tokenError}
          autoComplete="off"
          required
        />

        <Input
          id="reset-password-password"
          type={showPassword ? "text" : "password"}
          label="New Password"
          placeholder="At least 8 chars, include letter and number"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError(null);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          error={passwordError}
          autoComplete="new-password"
          required
          endAdornment={(
            <button
              type="button"
              className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        />

        <Input
          id="reset-password-confirm"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (error) setError(null);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
          error={confirmPasswordError}
          autoComplete="new-password"
          required
          endAdornment={(
            <button
              type="button"
              className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        />

        <Button type="submit" disabled={submitting} className="w-full" size="lg">
          <LockKeyhole size={16} />
          {submitting ? "Resetting password..." : "Reset Password"}
        </Button>

        <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Back to{" "}
          <Link to="/login" className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline">
            Login
          </Link>
        </p>

        <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          Need a new reset email?{" "}
          <Link to="/forgot-password" className="font-medium text-primary-600 transition hover:text-primary-700 hover:underline">
            Request another link
            <ArrowRight size={12} className="ml-1 inline-block" />
          </Link>
        </p>
      </form>
    </AuthPageFrame>
  );
}
