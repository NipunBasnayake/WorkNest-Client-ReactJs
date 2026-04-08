import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/common/Button";

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): GlobalErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Preserve diagnostics in devtools/monitoring; UI fallback remains user-friendly.
    console.error("Unhandled UI error caught by GlobalErrorBoundary", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div
          className="w-full max-w-md rounded-3xl border p-7 text-center shadow-xl"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
            }}
          >
            <AlertTriangle size={24} />
          </div>

          <h1 className="mb-2 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Something went wrong
          </h1>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            WorkNest hit an unexpected error. You can reload the app to recover your session.
          </p>

          <Button
            type="button"
            className="w-full"
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload WorkNest
          </Button>
        </div>
      </div>
    );
  }
}
