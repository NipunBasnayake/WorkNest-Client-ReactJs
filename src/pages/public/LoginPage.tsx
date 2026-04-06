import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogIn, Eye, EyeOff, CheckCircle2, Users,
  FolderKanban, Clock, Building2, Globe, Star, Zap, Shield, Sparkles,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

type LoginMode = "tenant" | "platform";

interface FormErrors {
  email?: string;
  password?: string;
  tenantKey?: string;
}

const BRAND_FEATURES = [
  { icon: CheckCircle2, text: "Task management & Kanban boards" },
  { icon: Users, text: "Team collaboration tools" },
  { icon: FolderKanban, text: "Project tracking dashboards" },
  { icon: Clock, text: "Attendance & leave management" },
];

const LOGIN_BENEFITS = [
  { icon: Zap, label: "Instant Access", description: "Sign in and start working" },
  { icon: Shield, label: "Secure Login", description: "Enterprise-grade security" },
  { icon: CheckCircle2, label: "Always Available", description: "Access 24/7 from anywhere" },
];

const TESTIMONIALS = [
  { name: "Alex Johnson", role: "Product Manager", company: "TechCorp", rating: 5, quote: "WorkNest transformed how our team collaborates." },
  { name: "Sarah Chen", role: "HR Director", company: "StartupXYZ", rating: 5, quote: "Finally, a platform that handles it all seamlessly." },
  { name: "Marcus Lee", role: "Team Lead", company: "Design Studio", rating: 5, quote: "The best investment we made this year." },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const initialTenantKey = queryParams.get("tenant") ?? "";
  const initialEmail = queryParams.get("email") ?? "";

  const [mode, setMode] = useState<LoginMode>("tenant");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [tenantKey, setTenantKey] = useState(initialTenantKey);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Where to redirect after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  function validate(): boolean {
    const e: FormErrors = {};
    if (!email.trim())
      e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Please enter a valid email address";
    if (!password.trim())
      e.password = "Password is required";
    if (mode === "tenant" && !tenantKey.trim())
      e.tenantKey = "Workspace key is required for workspace login";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    try {
      await login({
        email,
        password,
        tenantKey: mode === "tenant" ? tenantKey.trim() : null,
      });

      if (useAuthStore.getState().passwordChangeRequired) {
        navigate("/force-password-change", { replace: true });
        return;
      }

      // Redirect to where they came from OR to appropriate dashboard
      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else {
        const resolvedSession = useAuthStore.getState().sessionType;
        const destination = resolvedSession === "platform" ? "/platform/dashboard" : "/app/dashboard";
        navigate(destination, { replace: true });
      }
    } catch {
      // Error is already in store; no extra handling needed
    }
  }

  function handleModeChange(newMode: LoginMode) {
    setMode(newMode);
    setErrors({});
    clearError();
  }

  const sessionExpired = new URLSearchParams(location.search).get("reason") === "session_expired";

  return (
    <div className="h-screen w-full flex justify-center bg-[var(--bg-surface)]">
      <div className="flex w-full max-w-7xl overflow-hidden">
        {/* ── Left panel — benefits (desktop only) ── */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-br from-primary-500/20 via-primary-400/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-accent-400/15 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="mb-12 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border" style={{ background: "rgba(147,50,234,0.08)", borderColor: "rgba(147,50,234,0.2)", color: "var(--color-primary-600)" }}>
                <Sparkles size={12} />
                Welcome Back
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                Access your
                <br />
                <span style={{ background: "linear-gradient(135deg, #9332EA 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>workspace</span>
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Get back to managing your team, projects, and tasks in one powerful platform.
              </p>
            </div>

            {/* Benefits grid */}
            <div className="space-y-4 mb-12">
              {LOGIN_BENEFITS.map(({ icon: Icon, label, description }, idx) => (
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

            {/* Testimonials */}
            <div className="space-y-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-tertiary)" }}>
                <span className="inline-flex items-center gap-1.5">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  500+ teams trust WorkNest
                </span>
              </p>
              <div className="space-y-2 max-h-[100px] overflow-hidden">
                {TESTIMONIALS.map((testimonial, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg text-xs"
                    style={{ backgroundColor: "var(--bg-muted)" }}
                  >
                    <p style={{ color: "var(--text-secondary)" }} className="italic">"{testimonial.quote}"</p>
                    <p style={{ color: "var(--text-tertiary)" }} className="text-[10px] mt-1">
                      {testimonial.name} • {testimonial.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="space-y-2 p-4 rounded-xl border animate-fade-up" style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)", animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} style={{ color: "var(--color-primary-500)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Enterprise-grade security</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} style={{ color: "var(--color-primary-500)" }} />
              <span style={{ color: "var(--text-secondary)" }}>24/7 customer support</span>
            </div>
          </div>
        </div>

        {/* ── Right panel — login form ── */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 relative">
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary-400/8 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-300/6 rounded-full blur-3xl" />
          </div>

          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center mb-8 lg:hidden animate-fade-up">
              <Logo size="md" />
            </div>

            {/* Session expired notice */}
            {sessionExpired && (
              <div
                className="mb-4 px-4 py-3 rounded-xl border text-sm animate-fade-up"
                style={{ backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", color: "#d97706" }}
              >
                Your session has expired. Please sign in again.
              </div>
            )}

            {/* Card */}
            <div
              className="rounded-2xl p-8 sm:p-10 shadow-xl border animate-fade-up"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                boxShadow: "0 16px 48px rgba(147,50,234,0.12)",
              }}
            >
              <div className="mb-7">
                <h1 className="text-2xl font-bold mb-1.5">Sign In to WorkNest</h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Access your workspace and manage your team
                </p>
              </div>

              {/* Mode toggle */}
              <div
                className="flex rounded-xl p-1 mb-6 transition-all duration-300"
                style={{ backgroundColor: "var(--bg-muted)" }}
              >
                <button
                  type="button"
                  onClick={() => handleModeChange("tenant")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${mode === "tenant" ? "text-white shadow-sm" : ""
                    }`}
                  style={{
                    background: mode === "tenant"
                      ? "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)"
                      : "transparent",
                    color: mode === "tenant" ? "white" : "var(--text-secondary)",
                  }}
                >
                  <Building2 size={15} />
                  Workspace
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("platform")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer`}
                  style={{
                    background: mode === "platform"
                      ? "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)"
                      : "transparent",
                    color: mode === "platform" ? "white" : "var(--text-secondary)",
                  }}
                >
                  <Globe size={15} />
                  Platform
                </button>
              </div>

              {/* Backend error */}
              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl border text-sm animate-fade-up"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.07)",
                    borderColor: "rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Tenant key — only for workspace mode */}
                {mode === "tenant" && (
                  <div className="animate-fade-up">
                    <Input
                      id="login-tenant-key"
                      label="Workspace Key"
                      type="text"
                      placeholder="e.g. acme"
                      value={tenantKey}
                      onChange={(e) => setTenantKey(e.target.value.toLowerCase())}
                      error={errors.tenantKey}
                      hint="Your company's unique WorkNest workspace identifier"
                    />
                  </div>
                )}

                <div className="animate-fade-up" style={{ animationDelay: mode === "tenant" ? "0.1s" : "0s" }}>
                  <Input
                    id="login-email"
                    label="Email Address"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    autoComplete="email"
                  />
                </div>

                <div className="relative animate-fade-up" style={{ animationDelay: mode === "tenant" ? "0.2s" : "0.1s" }}>
                  <Input
                    id="login-password"
                    label="Password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-[34px] p-1 rounded cursor-pointer transition-colors hover:text-primary-500"
                    style={{ color: "var(--text-tertiary)" }}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex justify-end animate-fade-up" style={{ animationDelay: mode === "tenant" ? "0.3s" : "0.2s" }}>
                  <a
                    href="#"
                    className="text-xs font-semibold no-underline text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors hover:translate-x-0.5"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full animate-fade-up"
                  style={{ animationDelay: mode === "tenant" ? "0.4s" : "0.3s" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                      />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <p
                className="text-center text-xs mt-6 animate-fade-up"
                style={{ color: "var(--text-secondary)", animationDelay: mode === "tenant" ? "0.5s" : "0.4s" }}
              >
                Don&apos;t have an account?{" "}
                <Link
                  to="/register-company"
                  className="font-semibold text-primary-600 dark:text-primary-400 no-underline hover:text-primary-700 transition-colors hover:underline"
                >
                  Register your company
                </Link>
              </p>
            </div>

            {/* Demo quick access */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs animate-fade-up" style={{ animationDelay: mode === "tenant" ? "0.6s" : "0.5s" }}>
              <div className="w-px h-4" style={{ backgroundColor: "var(--border-default)" }} />
              <button
                type="button"
                onClick={() => {
                  setEmail("demo@worknest.app");
                  setPassword("Demo@123456");
                  setTenantKey("demo");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/20"
              >
                <Zap size={14} />
                Try Demo
              </button>
              <div className="w-px h-4" style={{ backgroundColor: "var(--border-default)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
