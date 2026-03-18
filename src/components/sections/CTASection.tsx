import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";

export function CTASection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Layered background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #6818ac 0%, #9332EA 40%, #7c1fd1 70%, #54168c 100%)",
            }}
          />
          {/* Radial glow top-right */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(192,132,252,0.4)_0%,_transparent_55%)]" />
          {/* Radial glow bottom-left */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(84,22,140,0.6)_0%,_transparent_55%)]" />

          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='white'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Decorative orbs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

          <div className="relative px-6 sm:px-12 lg:px-20 py-16 sm:py-20">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold mb-6 backdrop-blur-sm">
                <Sparkles size={12} />
                Start for free. No credit card required.
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
                Ready to Transform
                <br />
                <span className="text-purple-200">Your Workspace?</span>
              </h2>
              <p className="text-lg text-purple-100/90 mb-10 max-w-xl mx-auto leading-relaxed">
                Join forward-thinking companies who use WorkNest to manage their
                entire workforce from one platform. Get started in minutes.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
                {[
                  { value: "500+", label: "Companies" },
                  { value: "10k+", label: "Employees" },
                  { value: "99.9%", label: "Uptime" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-purple-200">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  to="/register-company"
                  className="bg-white! text-primary-700! hover:bg-primary-50! shadow-xl! hover:scale-[1.02] active:scale-[0.98]"
                >
                  Register Your Company
                  <ArrowRight size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  to="/login"
                  className="text-white! hover:bg-white/15! border border-white/20"
                >
                  Sign In to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
