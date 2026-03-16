import { ArrowRight, Sparkles, Users, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/common/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-br from-primary-500/20 via-primary-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-accent-400/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-primary-300/10 rounded-full blur-2xl" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0v40M40 0v40M0 0h40M0 40h40' stroke='%239332EA' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7 border"
              style={{
                background: "linear-gradient(135deg, rgba(147,50,234,0.10) 0%, rgba(192,132,252,0.08) 100%)",
                borderColor: "rgba(147,50,234,0.25)",
                color: "var(--color-primary-600)",
              }}
            >
              <Sparkles size={12} className="text-primary-500" />
              <span className="dark:text-primary-300">Multi-Tenant Workspace Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Your Team&apos;s Work,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #9332EA 0%, #a855f7 50%, #c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Organized.
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
              style={{ color: "var(--text-secondary)" }}
            >
              WorkNest brings employees, teams, projects, tasks, attendance, and
              collaboration into one powerful workspace — built for modern
              companies that move fast.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-10">
              <Button
                variant="primary"
                size="lg"
                to="/register-company"
                className="shadow-lg! shadow-primary-500/30! hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight size={18} />
              </Button>
              <Button variant="outline" size="lg" to="/login">
                Sign In
              </Button>
            </div>

            {/* Social proof strip */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              {/* Avatars */}
              <div className="flex items-center -space-x-2">
                {["#9332EA", "#a855f7", "#7c1fd1", "#c084fc"].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-900 flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ background: color, zIndex: 4 - i }}
                  >
                    {["A", "M", "S", "R"][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  500+
                </span>{" "}
                teams already managing work with WorkNest
              </p>
            </div>
          </div>

          {/* Right — enhanced mock dashboard visual */}
          <div className="relative hidden lg:block">
            <MockDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────
   Enhanced Mock Dashboard (pure CSS / components)
   ────────────────────────────────────────── */
function MockDashboard() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto">
      {/* Glow behind card */}
      <div className="absolute -inset-6 bg-gradient-to-br from-primary-500/25 via-accent-400/15 to-transparent rounded-3xl blur-3xl animate-pulse-glow" />

      {/* Main dashboard card */}
      <div
        className="relative rounded-2xl shadow-2xl border overflow-hidden"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "0 24px 60px -12px rgba(147,50,234,0.3)",
        }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              workspace.worknest.app
            </span>
          </div>
          <div
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(147,50,234,0.12) 0%, rgba(168,85,247,0.08) 100%)",
              color: "var(--color-primary-600)",
              border: "1px solid rgba(147,50,234,0.2)",
            }}
          >
            Acme Corp
          </div>
        </div>

        <div className="p-5">
          {/* Welcome header */}
          <div className="mb-5">
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Good morning, Alex 👋
            </p>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Workspace Dashboard
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { label: "Active Tasks", value: "24", icon: CheckCircle2, bg: "#9332EA" },
              { label: "Team Members", value: "18", icon: Users,         bg: "#7c1fd1" },
              { label: "Projects",     value: "7",  icon: TrendingUp,    bg: "#a855f7" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: "var(--bg-muted)" }}
              >
                <div
                  className="w-7 h-7 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${stat.bg}22` }}
                >
                  <stat.icon size={14} style={{ color: stat.bg }} />
                </div>
                <p className="text-xl font-bold" style={{ color: stat.bg }}>
                  {stat.value}
                </p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "var(--text-tertiary)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Task list */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Recent Tasks
            </p>
            <div className="space-y-2">
              {[
                { task: "Design system update",   status: "In Progress", color: "#9332EA", pct: 65 },
                { task: "API integration review", status: "Pending",     color: "#f59e0b", pct: 20 },
                { task: "Deploy v2.1 release",    status: "Completed",   color: "#22c55e", pct: 100 },
              ].map((item) => (
                <div
                  key={item.task}
                  className="rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: "var(--bg-muted)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.task}
                      </span>
                    </div>
                    <span className="text-[9px] font-semibold" style={{ color: item.color }}>
                      {item.status}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full" style={{ background: "var(--border-default)" }}>
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini chart row */}
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "var(--bg-muted)" }}
          >
            <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
              Weekly Productivity
            </p>
            <div className="flex items-end gap-1 h-10">
              {[35, 55, 45, 70, 60, 90, 78].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-300"
                  style={{
                    height: `${h}%`,
                    background: i === 5
                      ? "linear-gradient(to top, #9332EA, #c084fc)"
                      : "linear-gradient(to top, rgba(147,50,234,0.5), rgba(192,132,252,0.3))",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification card */}
      <div
        className="absolute -top-5 -right-8 rounded-2xl p-3.5 shadow-xl border w-52 animate-float"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "0 8px 24px rgba(147,50,234,0.2)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #9332EA 0%, #a855f7 100%)" }}
          >
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
              Sprint Completed 🎉
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Q1 Design Sprint · 8 tasks done
            </p>
          </div>
        </div>
      </div>

      {/* Floating team activity card */}
      <div
        className="absolute -bottom-5 -left-8 rounded-2xl p-3.5 shadow-xl border w-48 animate-float-delayed"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "0 8px 24px rgba(147,50,234,0.2)",
        }}
      >
        <p className="text-[10px] font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>
          Team Online
        </p>
        <div className="space-y-1.5">
          {[
            { name: "Alex M.",    color: "#9332EA", status: "In a task" },
            { name: "Sara K.",    color: "#22c55e", status: "Available" },
            { name: "Jordan P.",  color: "#f59e0b", status: "In meeting" },
          ].map((member) => (
            <div key={member.name} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                style={{ background: member.color }}
              >
                {member.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {member.name}
                </p>
                <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                  {member.status}
                </p>
              </div>
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0 ml-auto"
                style={{ backgroundColor: member.color }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
