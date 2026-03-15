import { useNavigate } from "react-router-dom";
import { TimerOff, LogIn } from "lucide-react";
import { Button } from "@/components/common/Button";

export function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl -z-0" />

      <div className="text-center max-w-md relative z-10">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.22)",
            color: "#f59e0b",
          }}
        >
          <TimerOff size={34} />
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Session Expired
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Your sign-in session is no longer valid. Please sign in again to continue.
        </p>

        <Button variant="primary" size="lg" onClick={() => navigate("/login", { replace: true })}>
          <LogIn size={18} />
          Go to Login
        </Button>
      </div>
    </div>
  );
}
