import { SECURITY_FEATURES } from "@/constants/features";
import { Lock, ShieldCheck, FileSearch, Server } from "lucide-react";

const securityIcons = [Lock, ShieldCheck, FileSearch, Server];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="py-20 lg:py-28 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-muted)" }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-500/5 rounded-full blur-3xl -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <span className="dark:text-primary-300">Enterprise-Grade Security</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Secure by Design
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            WorkNest is built with security at its core. Your company data is
            isolated, protected, and always under your control.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {SECURITY_FEATURES.map((feature, i) => {
            const Icon = securityIcons[i];
            return (
              <div
                key={feature.title}
                className="rounded-2xl p-6 border flex gap-4 transition-all duration-250 hover:shadow-lg hover:-translate-y-1 group"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, rgba(147,50,234,0.14) 0%, rgba(168,85,247,0.08) 100%)",
                    border: "1px solid rgba(147,50,234,0.2)",
                  }}
                >
                  <Icon size={20} style={{ color: "var(--color-primary-500)" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
