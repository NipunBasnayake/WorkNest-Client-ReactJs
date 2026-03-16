import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { registerTenantPublicApi } from "@/services/api/platformApi";


interface FormData {
  companyName: string;
  workspaceKey: string;
  adminName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  companyName?: string;
  workspaceKey?: string;
  adminName?: string;
  adminEmail?: string;
  password?: string;
  confirmPassword?: string;
}

const initialFormData: FormData = {
  companyName: "",
  workspaceKey: "",
  adminName: "",
  adminEmail: "",
  password: "",
  confirmPassword: "",
};

const STEPS_INFO = [
  { step: "1", label: "Company Details",  active: true  },
  { step: "2", label: "Admin Account",    active: false },
  { step: "3", label: "Start Building",   active: false },
];

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);
    setServerMessage(null);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!formData.companyName.trim()) e.companyName = "Company name is required";
    if (!formData.workspaceKey.trim()) e.workspaceKey = "Workspace key is required";
    else if (!/^[a-z0-9-]+$/.test(formData.workspaceKey))
      e.workspaceKey = "Only lowercase letters, numbers, and hyphens allowed";
    if (!formData.adminName.trim()) e.adminName = "Admin name is required";
    if (!formData.adminEmail.trim()) e.adminEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail))
      e.adminEmail = "Please enter a valid email address";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);
    setServerMessage(null);

    try {
      await registerTenantPublicApi({
        companyName: formData.companyName.trim(),
        tenantKey: formData.workspaceKey.trim(),
        adminFullName: formData.adminName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPassword: formData.password,
      });

      setServerMessage("Workspace registration completed. You can now sign in.");
      navigate(`/login?tenant=${encodeURIComponent(formData.workspaceKey.trim())}&email=${encodeURIComponent(formData.adminEmail.trim())}`);
    } catch (error: unknown) {
      setServerError(extractMessage(error) ?? "Unable to register workspace right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-400/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-300/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl">
        {/* Top bar */}
        <div className="flex items-center mb-8">
          <Logo size="md" />
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS_INFO.map((s, i) => (
            <div key={s.step} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-200"
                  style={{
                    background: s.active
                      ? "linear-gradient(135deg, #9332EA 0%, #a855f7 100%)"
                      : "var(--bg-muted)",
                    color: s.active ? "white" : "var(--text-tertiary)",
                    border: s.active
                      ? "none"
                      : "1.5px solid var(--border-default)",
                  }}
                >
                  {s.step}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block truncate"
                  style={{
                    color: s.active ? "var(--color-primary-600)" : "var(--text-tertiary)",
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS_INFO.length - 1 && (
                <div
                  className="flex-1 h-px mx-2"
                  style={{ backgroundColor: "var(--border-default)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 sm:p-10 shadow-xl border"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            boxShadow: "0 16px 48px rgba(147,50,234,0.12)",
          }}
        >
          <div className="mb-7">
            <h1 className="text-2xl font-bold mb-1.5">Create Your Workspace</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Set up your company on WorkNest in minutes &mdash; no credit card required.
            </p>
          </div>

          {serverMessage && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(16,185,129,0.3)", backgroundColor: "rgba(16,185,129,0.08)", color: "#10b981" }}
            >
              {serverMessage}
            </div>
          )}

          {serverError && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Company section */}
            <div className="space-y-4">
              <div
                className="flex items-center gap-2.5 pb-2 border-b"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(147,50,234,0.14) 0%, rgba(168,85,247,0.08) 100%)",
                    border: "1px solid rgba(147,50,234,0.2)",
                  }}
                >
                  <Building2 size={14} style={{ color: "var(--color-primary-500)" }} />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Company Details
                </span>
              </div>

              <Input
                id="reg-company-name"
                label="Company Name"
                type="text"
                placeholder="Acme Corporation"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                error={errors.companyName}
              />

              <Input
                id="reg-workspace-key"
                label="Workspace Key"
                type="text"
                placeholder="acme-corp"
                value={formData.workspaceKey}
                onChange={(e) => updateField("workspaceKey", e.target.value.toLowerCase())}
                error={errors.workspaceKey}
                hint="Unique identifier for your workspace. Lowercase letters, numbers, and hyphens only."
              />
            </div>

            {/* Admin section */}
            <div className="space-y-4">
              <div
                className="flex items-center gap-2.5 pb-2 border-b"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,31,209,0.14) 0%, rgba(147,50,234,0.08) 100%)",
                    border: "1px solid rgba(124,31,209,0.2)",
                  }}
                >
                  <User size={14} style={{ color: "var(--color-primary-600)" }} />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Admin Account
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  id="reg-admin-name"
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.adminName}
                  onChange={(e) => updateField("adminName", e.target.value)}
                  error={errors.adminName}
                />

                <Input
                  id="reg-admin-email"
                  label="Email Address"
                  type="email"
                  placeholder="admin@acme.com"
                  value={formData.adminEmail}
                  onChange={(e) => updateField("adminEmail", e.target.value)}
                  error={errors.adminEmail}
                  autoComplete="email"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    id="reg-password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    error={errors.password}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] p-1 rounded cursor-pointer transition-colors hover:text-primary-500"
                    style={{ color: "var(--text-tertiary)" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    id="reg-confirm-password"
                    label="Confirm Password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-[34px] p-1 rounded cursor-pointer transition-colors hover:text-primary-500"
                    style={{ color: "var(--text-tertiary)" }}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-lg! shadow-primary-500/25!"
              disabled={submitting}
            >
              {submitting ? "Creating Workspace..." : "Create Workspace"}
              {!submitting && <ArrowRight size={18} />}
            </Button>
          </form>

          <p
            className="text-center text-xs mt-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 dark:text-primary-400 no-underline hover:text-primary-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Trust note */}
        <p className="text-center text-xs mt-5" style={{ color: "var(--text-tertiary)" }}>
          No credit card required &bull; Free to start &bull; Setup in 2 minutes
        </p>
      </div>
    </div>
  );
}

function extractMessage(error: unknown): string | null {
  if (typeof error === "object" && error !== null) {
    const value = error as { response?: { data?: { message?: string } }; message?: string };
    return value.response?.data?.message ?? value.message ?? null;
  }
  return null;
}
