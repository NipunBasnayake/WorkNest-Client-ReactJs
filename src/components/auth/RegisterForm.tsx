import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { registerTenantPublicApi } from "@/services/api/platformApi";
import { validatePasswordStrength } from "@/modules/auth/passwordValidation";
import { getErrorMessage } from "@/utils/errorHandler";

interface RegisterTouched {
  companyName: boolean;
  workspaceKey: boolean;
  adminName: boolean;
  adminEmail: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export function RegisterForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState("");
  const [workspaceKey, setWorkspaceKey] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [touched, setTouched] = useState<RegisterTouched>({
    companyName: false,
    workspaceKey: false,
    adminName: false,
    adminEmail: false,
    password: false,
    confirmPassword: false,
  });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const companyNameError = useMemo(() => {
    if (!touched.companyName) return undefined;
    if (!companyName.trim()) return "Company name is required.";
    return undefined;
  }, [companyName, touched.companyName]);

  const workspaceKeyError = useMemo(() => {
    if (!touched.workspaceKey) return undefined;
    if (!workspaceKey.trim()) return "Workspace key is required.";
    if (!/^[a-z0-9-]+$/.test(workspaceKey.trim())) {
      return "Use lowercase letters, numbers, and hyphens only.";
    }
    return undefined;
  }, [workspaceKey, touched.workspaceKey]);

  const adminNameError = useMemo(() => {
    if (!touched.adminName) return undefined;
    if (!adminName.trim()) return "Admin name is required.";
    return undefined;
  }, [adminName, touched.adminName]);

  const adminEmailError = useMemo(() => {
    if (!touched.adminEmail) return undefined;
    if (!adminEmail.trim()) return "Admin email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) return "Enter a valid email address.";
    return undefined;
  }, [adminEmail, touched.adminEmail]);

  const passwordError = useMemo(() => {
    if (!touched.password) return undefined;
    return validatePasswordStrength(password) ?? undefined;
  }, [password, touched.password]);

  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword) return undefined;
    if (!confirmPassword.trim()) return "Confirm Password is required.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return undefined;
  }, [confirmPassword, password, touched.confirmPassword]);

  function validateStepOne(): boolean {
    const hasCompanyName = Boolean(companyName.trim());
    const hasWorkspaceKey = Boolean(workspaceKey.trim());
    const workspaceKeyValid = /^[a-z0-9-]+$/.test(workspaceKey.trim());

    setTouched((prev) => ({
      ...prev,
      companyName: true,
      workspaceKey: true,
    }));

    if (!hasCompanyName || !hasWorkspaceKey || !workspaceKeyValid) {
      setSubmitMessage("Please complete company details before continuing.");
      return false;
    }

    setSubmitMessage(null);
    return true;
  }

  function goToStepTwo() {
    if (!validateStepOne()) return;
    setCurrentStep(2);
  }

  function goBackToStepOne() {
    if (submitting || redirecting) return;
    setCurrentStep(1);
    setSubmitMessage(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentStep === 1) {
      goToStepTwo();
      return;
    }

    setRedirecting(false);
    setTouched({
      companyName: true,
      workspaceKey: true,
      adminName: true,
      adminEmail: true,
      password: true,
      confirmPassword: true,
    });

    if (companyNameError || workspaceKeyError || adminNameError || adminEmailError || passwordError || confirmPasswordError) {
      setSubmitMessage("Please fix the highlighted fields before submitting.");
      return;
    }

    if (!companyName.trim() || !workspaceKey.trim() || !adminName.trim() || !adminEmail.trim() || !password.trim() || !confirmPassword.trim()) {
      setSubmitMessage("All fields are required.");
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      await registerTenantPublicApi({
        companyName: companyName.trim(),
        tenantKey: workspaceKey.trim(),
        adminFullName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword: password,
      });

      setSubmitMessage("Workspace created successfully. Redirecting to login...");
      setRedirecting(true);
      redirectTimerRef.current = window.setTimeout(() => {
        navigate(`/login?tenant=${encodeURIComponent(workspaceKey.trim())}&email=${encodeURIComponent(adminEmail.trim())}`);
      }, 1500);
    } catch (error: unknown) {
      setSubmitMessage(getErrorMessage(error, "Unable to register workspace right now. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const isSuccessMessage = submitMessage?.toLowerCase().includes("successfully") ?? false;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div
        className="grid grid-cols-2 gap-2 rounded-xl p-1"
        style={{ backgroundColor: "color-mix(in srgb, var(--bg-muted) 90%, var(--color-primary-50) 10%)" }}
      >
        <div
          className="rounded-lg px-3 py-2 text-center text-xs font-semibold"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg-surface) 82%, transparent)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          1. Workspace
        </div>
        <div
          className="rounded-lg px-3 py-2 text-center text-xs font-semibold"
          style={{
            backgroundColor: currentStep === 2
              ? "color-mix(in srgb, var(--bg-surface) 82%, transparent)"
              : "transparent",
            color: currentStep === 2 ? "var(--text-primary)" : "var(--text-tertiary)",
            border: currentStep === 2 ? "1px solid var(--border-default)" : "1px solid transparent",
          }}
        >
          2. Admin Setup
        </div>
      </div>

      {submitMessage ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            isSuccessMessage
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          {submitMessage}
        </div>
      ) : null}

      {currentStep === 1 ? (
        <>
          <Input
            id="register-company-name"
            type="text"
            label="Company Name"
            placeholder="Acme Corporation"
            value={companyName}
            onChange={(event) => {
              setCompanyName(event.target.value);
              setSubmitMessage(null);
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, companyName: true }))}
            error={companyNameError}
            required
            autoComplete="organization"
          />

          <Input
            id="register-workspace-key"
            type="text"
            label="Workspace ID (Team Accounts)"
            hint="This is your company sign-in key for tenant users. Use lowercase letters, numbers, and hyphens."
            placeholder="acme-corp"
            value={workspaceKey}
            onChange={(event) => {
              setWorkspaceKey(event.target.value.toLowerCase());
              setSubmitMessage(null);
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, workspaceKey: true }))}
            error={workspaceKeyError}
            required
            autoComplete="off"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full transition duration-200 hover:brightness-105"
            disabled={submitting || redirecting}
          >
            Next
            <ArrowRight size={16} />
          </Button>
        </>
      ) : (
        <>
          <Input
            id="register-admin-name"
            type="text"
            label="Admin Full Name"
            placeholder="John Doe"
            value={adminName}
            onChange={(event) => {
              setAdminName(event.target.value);
              setSubmitMessage(null);
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, adminName: true }))}
            error={adminNameError}
            required
            autoComplete="name"
          />

          <Input
            id="register-admin-email"
            type="email"
            label="Admin Email"
            placeholder="admin@acme.com"
            value={adminEmail}
            onChange={(event) => {
              setAdminEmail(event.target.value);
              setSubmitMessage(null);
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, adminEmail: true }))}
            error={adminEmailError}
            required
            autoComplete="email"
          />

          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="At least 8 chars, include letter and number"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setSubmitMessage(null);
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            error={passwordError}
            required
            autoComplete="new-password"
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setSubmitMessage(null);
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
            error={confirmPasswordError}
            required
            autoComplete="new-password"
            endAdornment={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={goBackToStepOne}
              disabled={submitting || redirecting}
            >
              Back
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full transition duration-200 hover:brightness-105"
              disabled={submitting || redirecting}
            >
              {redirecting ? "Redirecting..." : submitting ? "Creating..." : "Create"}
              {!submitting && !redirecting && <ArrowRight size={16} />}
            </Button>
          </div>
        </>
      )}

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
