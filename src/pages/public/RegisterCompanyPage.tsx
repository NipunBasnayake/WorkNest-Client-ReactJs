import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, Eye, EyeOff, ArrowRight, Lock, Shield, Zap, CheckCircle2, Sparkles } from "lucide-react";
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

const BENEFITS = [
  { icon: Zap, label: "Lightning Fast", description: "Get set up in 2 minutes" },
  { icon: Shield, label: "Secure & Reliable", description: "Enterprise-grade security" },
  { icon: CheckCircle2, label: "All-in-One", description: "Everything you need" },
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-400/8 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-300/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-7xl flex gap-8 lg:gap-12">

        {/* Left benefits section — desktop only */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-8">
          <div className="mb-12 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border" style={{ background: "rgba(147,50,234,0.08)", borderColor: "rgba(147,50,234,0.2)", color: "var(--color-primary-600)" }}>
              <Sparkles size={12} />
              Everything Included
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
              Set up your team
              <br />
              <span style={{ background: "linear-gradient(135deg, #9332EA 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>in minutes</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Start managing your entire workforce today. No credit card required, no setup fees.
            </p>
          </div>

          {/* Benefits grid */}
          <div className="space-y-4 mb-12">
            {BENEFITS.map(({ icon: Icon, label, description }, idx) => (
              <div
                key={label}
                className="flex gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:border-primary-300 animate-fade-up"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  animationDelay: `${0.1 * idx}s`,
                }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(147,50,234,0.14) 0%, rgba(168,85,247,0.08) 100%)" }}>
                  <Icon size={20} style={{ color: "var(--color-primary-500)" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="space-y-3 p-4 rounded-xl border animate-fade-up" style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)", animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} style={{ color: "var(--color-primary-500)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Industry-leading security & compliance</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} style={{ color: "var(--color-primary-500)" }} />
              <span style={{ color: "var(--text-secondary)" }}>24/7 customer support included</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} style={{ color: "var(--color-primary-500)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Free trial — no payment method needed</span>
            </div>
          </div>
        </div>

        {/* Right form section */}
        <div className="w-full lg:w-1/2">

          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8 animate-fade-up">
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
                      transform: s.active ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    {s.step}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block truncate transition-colors duration-200"
                    style={{
                      color: s.active ? "var(--color-primary-600)" : "var(--text-tertiary)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS_INFO.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2 transition-colors duration-200"
                    style={{ backgroundColor: "var(--border-default)" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 sm:p-10 shadow-xl border animate-fade-up"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              boxShadow: "0 16px 48px rgba(147,50,234,0.12)",
              animationDelay: "0.1s",
            }}
          >
            <div className="mb-7">
              <h1 className="text-2xl font-bold mb-1.5">Create Your Workspace</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Set up your company on WorkNest in minutes — no credit card required.
              </p>
            </div>

            {serverMessage && (
              <div
                className="mb-4 rounded-xl border px-4 py-3 text-sm animate-fade-up flex items-center gap-2"
                style={{ borderColor: "rgba(16,185,129,0.3)", backgroundColor: "rgba(16,185,129,0.08)", color: "#10b981" }}
              >
                <CheckCircle2 size={16} />
                {serverMessage}
              </div>
            )}

            {serverError && (
              <div
                className="mb-4 rounded-xl border px-4 py-3 text-sm animate-fade-up"
                style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
              >
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Company section */}
              <div className="space-y-4 animate-fade-up" style={{ animationDelay: "0.15s" }}>
                <div
                  className="flex items-center gap-2.5 pb-2 border-b transition-colors duration-200"
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
              <div className="space-y-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <div
                  className="flex items-center gap-2.5 pb-2 border-b transition-colors duration-200"
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

                {/* Security badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "var(--bg-muted)" }}>
                  <Lock size={14} style={{ color: "var(--color-primary-500)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Your password is encrypted and never shared</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-lg! shadow-primary-500/25! hover:scale-[1.02] active:scale-[0.98] transition-transform"
                disabled={submitting}
              >
                {submitting ? "Creating Workspace..." : "Create Workspace"}
                {!submitting && <ArrowRight size={18} />}
              </Button>
            </form>

            <p
              className="text-center text-xs mt-6 animate-fade-up"
              style={{ color: "var(--text-secondary)", animationDelay: "0.3s" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary-600 dark:text-primary-400 no-underline hover:text-primary-700 transition-colors hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Trust note */}
          <div className="text-center text-xs mt-6 space-y-2 animate-fade-up" style={{ animationDelay: "0.35s", color: "var(--text-tertiary)" }}>
            <p>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={12} style={{ color: "var(--color-primary-500)" }} />
                <span>No credit card required</span>
              </span>
              {" • "}
              <span>Free to start</span>
              {" • "}
              <span>Setup in 2 minutes</span>
            </p>
          </div>
        </div>
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
