import { ROLE_BENEFITS } from "@/constants/features";
import { Shield, BarChart3, Users, UserCheck } from "lucide-react";

const roleIcons = {
  Admin:    Shield,
  Manager:  BarChart3,
  HR:       Users,
  Employee: UserCheck,
};

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  Admin:    { bg: "rgba(147,50,234,0.12)",  text: "#9332EA", border: "rgba(147,50,234,0.25)" },
  Manager:  { bg: "rgba(124,31,209,0.12)",  text: "#7c1fd1", border: "rgba(124,31,209,0.25)" },
  HR:       { bg: "rgba(168,85,247,0.12)",  text: "#a855f7", border: "rgba(168,85,247,0.25)" },
  Employee: { bg: "rgba(84,22,140,0.12)",   text: "#54168c", border: "rgba(84,22,140,0.25)" },
};

export function RoleBenefitsSection() {
  return (
    <section id="benefits" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: "rgba(147,50,234,0.08)",
              borderColor: "rgba(147,50,234,0.2)",
              color: "var(--color-primary-600)",
            }}
          >
            <span className="dark:text-primary-300">Built For Everyone</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Tailored for Every Role
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            Whether you&apos;re an admin configuring the workspace or an employee
            tracking daily tasks, WorkNest adapts to your needs.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROLE_BENEFITS.map((item) => {
            const Icon = roleIcons[item.role as keyof typeof roleIcons];
            const colors = roleColors[item.role] ?? roleColors.Admin;
            return (
              <div
                key={item.role}
                className="rounded-2xl p-6 border transition-all duration-250 hover:-translate-y-1.5 hover:shadow-lg group"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Icon size={20} style={{ color: colors.text }} />
                </div>

                <div
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: colors.text }}
                >
                  {item.role}
                </div>
                <h3
                  className="text-base font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.description}
                </h3>

                <ul className="space-y-2 mt-4">
                  {item.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2.5 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: colors.text }}
                      />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
