import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams, type Location } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import type { SessionType } from "@/types";

interface LoginTouched {
  email: boolean;
  password: boolean;
}

interface LoginRouteState {
  from?: Location;
  message?: string;
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

function readLoginRouteState(value: unknown): LoginRouteState {
  if (!value || typeof value !== "object") return {};

  const candidate = value as { from?: unknown; message?: unknown };
  const message = typeof candidate.message === "string" && candidate.message.trim()
    ? candidate.message.trim()
    : undefined;

  const maybeFrom = candidate.from;
  if (!maybeFrom || typeof maybeFrom !== "object") {
    return { message };
  }

  const from = maybeFrom as Partial<Location>;
  if (typeof from.pathname !== "string" || !from.pathname.startsWith("/")) {
    return { message };
  }

  return {
    message,
    from: {
      ...from,
      pathname: from.pathname,
      search: typeof from.search === "string" ? from.search : "",
      hash: typeof from.hash === "string" ? from.hash : "",
      state: from.state,
      key: typeof from.key === "string" ? from.key : "",
    } as Location,
  };
}

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function resolveRedirectPath(from: Location | undefined, sessionType: SessionType | null): string {
  const fallback = sessionType === "platform" ? "/platform/dashboard" : "/app/dashboard";
  if (!from) return fallback;

  const pathname = from.pathname || "";
  if (!pathname.startsWith("/") || isAuthOnlyPath(pathname)) {
    return fallback;
  }

  return `${pathname}${from.search ?? ""}${from.hash ?? ""}`;
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    login,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    sessionType,
    passwordChangeRequired,
    passwordChangeChallenge,
  } = useAuth();

  const routeState = useMemo(() => readLoginRouteState(location.state), [location.state]);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [tenantKey, setTenantKey] = useState(searchParams.get("tenant") ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<LoginTouched>({ email: false, password: false });
  const [formError, setFormError] = useState<string | null>(null);

  const redirectPath = useMemo(
    () => resolveRedirectPath(routeState.from, sessionType),
    [routeState.from, sessionType]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(redirectPath, { replace: true });
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    if (passwordChangeRequired && passwordChangeChallenge) {
      navigate("/force-password-change", {
        replace: true,
        state: routeState.from ? { from: routeState.from } : undefined,
      });
    }
  }, [passwordChangeRequired, passwordChangeChallenge, navigate, routeState.from]);

  const emailError = useMemo(() => {
    if (!touched.email) return undefined;
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
    return undefined;
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password) return undefined;
    if (!password.trim()) return "Password is required.";
    return undefined;
  }, [password, touched.password]);

  const forgotPasswordHref = useMemo(() => {
    const params = new URLSearchParams();
    if (email.trim()) params.set("email", email.trim());
    if (tenantKey.trim()) params.set("tenant", tenantKey.trim());
    const query = params.toString();
    return query ? `/forgot-password?${query}` : "/forgot-password";
  }, [email, tenantKey]);

  const infoMessage = !formError && !error ? routeState.message ?? null : null;
  const displayError = formError || error;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Enter a valid email address.");
      return;
    }

    try {
      await login({ email: email.trim(), password, tenantKey: tenantKey.trim() || null });
    } catch {
      // Store handles server errors.
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {infoMessage ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(14,165,233,0.35)",
            backgroundColor: "rgba(14,165,233,0.08)",
            color: "#0ea5e9",
          }}
        >
          {infoMessage}
        </div>
      ) : null}

      {displayError ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(239,68,68,0.35)", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
        >
          {displayError}
        </div>
      ) : null}

      <Input
        id="login-email"
        type="email"
        label="Email"
        placeholder="you@company.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setFormError(null);
          if (error) clearError();
        }}
        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
        error={emailError}
        required
        autoComplete="email"
      />

      <Input
        id="login-password"
        type={showPassword ? "text" : "password"}
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setFormError(null);
          if (error) clearError();
        }}
        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
        error={passwordError}
        required
        autoComplete="current-password"
        endAdornment={
          <button
            type="button"
            className="flex h-full items-center justify-center px-3 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <Input
        id="login-tenant-key"
        type="text"
        label="Workspace ID (Team Accounts)"
        hint="Use your company workspace ID for tenant sign-in. Platform accounts can leave this blank."
        placeholder="your-company-key"
        value={tenantKey}
        onChange={(event) => setTenantKey(event.target.value.toLowerCase())}
        autoComplete="off"
      />

      <div
        className="rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed"
        style={{
          borderColor: "color-mix(in srgb, var(--border-default) 84%, var(--color-primary-300) 16%)",
          backgroundColor: "color-mix(in srgb, var(--bg-muted) 90%, var(--color-primary-50) 10%)",
          color: "var(--text-secondary)",
        }}
      >
        Tip: Team members usually sign in with a workspace ID. Platform admins can sign in using email and password only.
      </div>

      <p className="text-right text-xs" style={{ color: "var(--text-tertiary)" }}>
        <Link to={forgotPasswordHref} className="font-medium text-primary-600 transition hover:text-primary-700 hover:underline">
          Forgot your password?
        </Link>
      </p>

      <Button
        type="submit"
        disabled={isLoading}
        variant="primary"
        size="lg"
        className="w-full transition duration-200 hover:brightness-105"
      >
        {isLoading ? "Signing in..." : "Sign In"}
        {!isLoading && <ArrowRight size={16} />}
      </Button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline">
          Register your company
        </Link>
      </p>
    </form>
  );
}
