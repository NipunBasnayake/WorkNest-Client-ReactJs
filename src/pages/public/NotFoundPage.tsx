import { Button } from "@/components/common/Button";
import { Home, ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export function NotFoundPage() {
  usePageMeta({ title: "Page Not Found - WorkNest" });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/8 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-400/6 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-lg">
        {/* Large 404 */}
        <div className="relative mb-6">
          <span
            className="text-[10rem] lg:text-[14rem] font-extrabold leading-none select-none"
            style={{
              background: "linear-gradient(135deg, rgba(147,50,234,0.15) 0%, rgba(192,132,252,0.08) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </span>
          {/* Overlay gradient text */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[10rem] lg:text-[14rem] font-extrabold leading-none select-none"
            style={{
              background: "linear-gradient(135deg, #9332EA 0%, #a855f7 50%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0.4,
            }}
          >
            404
          </span>
        </div>

        {/* Icon & message */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(147,50,234,0.12) 0%, rgba(168,85,247,0.08) 100%)",
            border: "1px solid rgba(147,50,234,0.2)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-primary-500)" }}
          >
            <path d="M3 12a9 9 0 1018 0A9 9 0 003 12z" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Page Not Found</h1>
        <p className="text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="primary" size="lg" to="/">
            <Home size={18} />
            Back to Home
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} />
            Go Back
          </Button>
        </div>

        {/* Brand mark */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: "var(--color-primary-500)" }}
          />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            WorkNest — Where Work Gets Done
          </span>
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: "var(--color-primary-500)" }}
          />
        </div>
      </div>
    </div>
  );
}
