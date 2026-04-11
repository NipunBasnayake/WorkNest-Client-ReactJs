import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { forgotPasswordApi } from "@/services/api/authApi";
import { getErrorMessage } from "@/utils/errorHandler";

interface ForgotTouched {
  email: boolean;
}

export function ForgotPasswordPage() {
  usePageMeta({ title: "Forgot Password - WorkNest" });

  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [tenantKey, setTenantKey] = useState(searchParams.get("tenant") ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<ForgotTouched>({ email: false });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!touched.email) return undefined;
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
    return undefined;
  }, [email, touched.email]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ email: true });
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Please provide the email address for your account.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPasswordApi(email.trim(), tenantKey.trim() || null);
      setSuccessMessage(
        "If an account exists for this email, password reset instructions have been sent."
      );
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, "Unable to start password reset right now. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageFrame
      title="Reset your password"
      description="Enter your account email and we will send reset instructions if the account exists."
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
          id="forgot-password-email"
          type="email"
          label="Email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          onBlur={() => setTouched({ email: true })}
          error={emailError}
          autoComplete="email"
          required
        />

        <Input
          id="forgot-password-tenant"
          type="text"
          label="Workspace ID (Optional)"
          hint="Provide this for tenant accounts if your backend requires tenant scoping."
          placeholder="your-company-key"
          value={tenantKey}
          onChange={(event) => setTenantKey(event.target.value.toLowerCase())}
          autoComplete="off"
        />

        <Button type="submit" disabled={submitting} className="w-full" size="lg">
          <Mail size={16} />
          {submitting ? "Sending reset instructions..." : "Send Reset Link"}
        </Button>

        <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Remember your password?{" "}
          <Link to="/login" className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline">
            Back to login
          </Link>
        </p>

        <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          Already have a reset token?{" "}
          <Link to="/reset-password" className="font-medium text-primary-600 transition hover:text-primary-700 hover:underline">
            Reset now
            <ArrowRight size={12} className="ml-1 inline-block" />
          </Link>
        </p>
      </form>
    </AuthPageFrame>
  );
}
