import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogIn, Eye, EyeOff, CheckCircle2, Users,
  FolderKanban, Clock, Building2, Globe,
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
  { icon: Users,        text: "Team collaboration tools" },
  { icon: FolderKanban, text: "Project tracking dashboards" },
  { icon: Clock,        text: "Attendance & leave management" },
];

export function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const initialTenantKey = queryParams.get("tenant") ?? "";
  const initialEmail = queryParams.get("email") ?? "";

  const [mode,        setMode]        = useState<LoginMode>("tenant");
  const [email,       setEmail]       = useState(initialEmail);
  const [password,    setPassword]    = useState("");
  const [tenantKey,   setTenantKey]   = useState(initialTenantKey);
  const [showPwd,     setShowPwd]     = useState(false);
  const [errors,      setErrors]      = useState<FormErrors>({});

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
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* ── Left panel — branding (desktop only) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-10 xl:p-14 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #6818ac 0%, #9332EA 45%, #7c1fd1 75%, #54168c 100%)",
        }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='white'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <Logo size="lg" />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Manage your entire
            <br />
            <span className="text-purple-200">workforce in one place.</span>
          </h2>
          <p className="text-purple-100/80 text-sm mb-10 leading-relaxed max-w-sm">
            Everything your team needs — tasks, projects, attendance, and
            collaboration — all in one beautiful workspace.
          </p>
          <ul className="space-y-3.5">
            {BRAND_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-purple-200" />
                </div>
                <span className="text-sm text-purple-100">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-purple-300/70">
            Trusted by 500+ teams worldwide &mdash; WorkNest &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 relative">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary-400/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-300/6 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          {/* Session expired notice */}
          {sessionExpired && (
            <div className="mb-4 px-4 py-3 rounded-xl border text-sm" style={{ backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", color: "#d97706" }}>
              Your session has expired. Please sign in again.
            </div>
          )}

          {/* Card */}
          <div
            className="rounded-2xl p-8 sm:p-10 shadow-xl border"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor:     "var(--border-default)",
              boxShadow:       "0 16px 48px rgba(147,50,234,0.12)",
            }}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1.5">Welcome back</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Sign in to access your workspace
              </p>
            </div>

            {/* Mode toggle */}
            <div
              className="flex rounded-xl p-1 mb-6"
              style={{ backgroundColor: "var(--bg-muted)" }}
            >
              <button
                type="button"
                onClick={() => handleModeChange("tenant")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  mode === "tenant" ? "text-white shadow-sm" : ""
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
                className="mb-4 px-4 py-3 rounded-xl border text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.07)",
                  borderColor:     "rgba(239,68,68,0.2)",
                  color:           "#f87171",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Tenant key — only for workspace mode */}
              {mode === "tenant" && (
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
              )}

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

              <div className="relative">
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

              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-xs font-semibold no-underline text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
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
              className="text-center text-xs mt-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Don&apos;t have an account?{" "}
              <Link
                to="/register-company"
                className="font-semibold text-primary-600 dark:text-primary-400 no-underline hover:text-primary-700 transition-colors"
              >
                Register your company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
