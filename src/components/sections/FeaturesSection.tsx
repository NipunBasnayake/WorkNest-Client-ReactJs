import { FEATURES } from "@/constants/features";
import * as Icons from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28">
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
            <span className="dark:text-primary-300">Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything You Need to Manage Work
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            From employee onboarding to project delivery, WorkNest provides a
            complete suite of tools for modern workforce management.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map((feature, idx) => {
            const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[feature.icon];
            const isHighlighted = idx === 0 || idx === 3;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl p-6 border transition-all duration-250 hover:-translate-y-1.5 hover:shadow-lg cursor-default relative overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: isHighlighted ? "rgba(147,50,234,0.25)" : "var(--border-default)",
                  boxShadow: isHighlighted ? "0 0 0 1px rgba(147,50,234,0.1)" : undefined,
                }}
              >
                {/* Subtle hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{
                    background: "radial-gradient(ellipse at top left, rgba(147,50,234,0.06) 0%, transparent 70%)",
                  }}
                />

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110 relative z-10"
                  style={{
                    background: "linear-gradient(135deg, rgba(147,50,234,0.14) 0%, rgba(168,85,247,0.08) 100%)",
                    border: "1px solid rgba(147,50,234,0.2)",
                  }}
                >
                  {IconComponent && (
                    <IconComponent
                      size={18}
                      style={{ color: "var(--color-primary-500)" }}
                    />
                  )}
                </div>
                <h3
                  className="text-sm font-semibold mb-2 relative z-10"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-xs leading-relaxed relative z-10"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
