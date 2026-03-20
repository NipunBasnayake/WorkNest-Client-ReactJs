type AlertTone = "success" | "warning" | "error" | "info";

interface InlineAlertProps {
  tone: AlertTone;
  message: string;
  className?: string;
}

const TONE_STYLES: Record<AlertTone, { borderColor: string; backgroundColor: string; color: string }> = {
  success: {
    borderColor: "rgba(16,185,129,0.25)",
    backgroundColor: "rgba(16,185,129,0.08)",
    color: "#10b981",
  },
  warning: {
    borderColor: "rgba(245,158,11,0.3)",
    backgroundColor: "rgba(245,158,11,0.08)",
    color: "#d97706",
  },
  error: {
    borderColor: "rgba(239,68,68,0.25)",
    backgroundColor: "rgba(239,68,68,0.06)",
    color: "#ef4444",
  },
  info: {
    borderColor: "rgba(59,130,246,0.25)",
    backgroundColor: "rgba(59,130,246,0.08)",
    color: "#2563eb",
  },
};

export function InlineAlert({ tone, message, className = "" }: InlineAlertProps) {
  const style = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${className}`.trim()}
      style={{
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
        color: style.color,
      }}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
