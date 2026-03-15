import { STEPS } from "@/constants/features";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 lg:py-28"
      style={{ backgroundColor: "var(--bg-muted)" }}
    >
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
            <span className="dark:text-primary-300">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Up and Running in Minutes
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            Getting started with WorkNest is simple. Follow these four steps to
            transform how your company manages work.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(147,50,234,0.4) 0%, rgba(147,50,234,0.1) 100%)",
                  }}
                />
              )}

              <div
                className="rounded-2xl p-6 border text-center transition-all duration-250 hover:shadow-lg hover:-translate-y-1 relative z-10"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                }}
              >
                {/* Step badge */}
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white text-lg font-bold mb-5"
                  style={{
                    background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)",
                    boxShadow: "0 8px 20px rgba(147,50,234,0.35)",
                  }}
                >
                  {step.number}
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
