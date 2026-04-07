import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { NetworkStatusBanner } from "@/components/common/NetworkStatusBanner";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      <Navbar />

      <main className="relative flex-1 pt-16">
        <NetworkStatusBanner />

        <section
          className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--bg-base) 88%, var(--color-primary-100) 12%) 0%, color-mix(in srgb, var(--bg-muted) 90%, var(--color-primary-200) 10%) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 14% 18%, var(--glow-primary) 0%, transparent 32%)",
                "radial-gradient(circle at 84% 78%, color-mix(in srgb, var(--glow-primary) 64%, rgba(192,132,252,0.28)) 0%, transparent 34%)",
                "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(147,50,234,0.04) 100%)",
              ].join(", "),
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(147,50,234,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(147,50,234,0.035) 1px, transparent 1px)",
              backgroundSize: "76px 76px",
              maskImage: "linear-gradient(to bottom, black, transparent 95%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 95%)",
            }}
          />

          <div className="relative flex w-full items-center justify-center">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
