import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";

export function UnauthorizedPage() {
  const navigate               = useNavigate();
  const { isAuthenticated, sessionType } = useAuth();

  function handleBack() {
    if (isAuthenticated) {
      navigate(sessionType === "platform" ? "/platform/dashboard" : "/app/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl -z-0" />

      <div className="text-center max-w-md relative z-10">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
          style={{
            background:   "rgba(239,68,68,0.08)",
            border:       "1px solid rgba(239,68,68,0.18)",
            color:        "#f87171",
          }}
        >
          <ShieldOff size={36} />
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Access Denied
        </h1>
        <p className="text-sm mb-8 max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          You don&apos;t have permission to view this page. You may need to log in with a different account
          or request access from your administrator.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="primary" size="lg" onClick={handleBack}>
            {isAuthenticated ? (
              <>
                <ArrowLeft size={18} /> Back to Dashboard
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </Button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full" style={{ background: "var(--color-primary-500)" }} />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            WorkNest — Where Work Gets Done
          </span>
          <div className="w-1 h-1 rounded-full" style={{ background: "var(--color-primary-500)" }} />
        </div>
      </div>
    </div>
  );
}
