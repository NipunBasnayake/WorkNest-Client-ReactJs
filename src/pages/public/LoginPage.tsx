import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LogIn, Eye, EyeOff, CheckCircle2, Users, FolderKanban, Clock } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";


interface FormErrors {
  email?: string;
  password?: string;
}

const BRAND_FEATURES = [
  { icon: CheckCircle2, text: "Task management & Kanban boards" },
  { icon: Users,        text: "Team collaboration tools" },
  { icon: FolderKanban, text: "Project tracking dashboards" },
  { icon: Clock,        text: "Attendance & leave management" },
];

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email address";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    console.log("Login submitted:", { email, rememberMe });
  }

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
        {/* Ambient orbs */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        {/* Content */}
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
        {/* Ambient decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary-400/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-300/6 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo — visible only when left panel is hidden */}
          <div className="flex items-center mb-8 lg:hidden">
            <Logo size="md" />
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
              <h1 className="text-2xl font-bold mb-1.5">Welcome back</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Sign in to access your workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  autoComplete="current-password"
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

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 cursor-pointer accent-primary-500"
                  />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-xs font-semibold no-underline text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 shadow-lg! shadow-primary-500/25!"
              >
                <LogIn size={18} />
                Sign In
              </Button>
            </form>

            <p
              className="text-center text-xs mt-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
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
