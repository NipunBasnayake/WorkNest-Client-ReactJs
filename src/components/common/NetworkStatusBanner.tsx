import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type BannerTone = "danger" | "warning";

interface BannerStyle {
  tone: BannerTone;
  label: string;
}

function resolveBannerStyle(kind: string): BannerStyle {
  if (kind === "offline") {
    return { tone: "danger", label: "Offline" };
  }

  if (kind === "timeout") {
    return { tone: "warning", label: "Timeout" };
  }

  return { tone: "warning", label: "Connection" };
}

export function NetworkStatusBanner() {
  const { issue, clearIssue } = useNetworkStatus();
  if (!issue) return null;

  const style = resolveBannerStyle(issue.kind);
  const palette = style.tone === "danger"
    ? {
      borderColor: "rgba(239,68,68,0.28)",
      backgroundColor: "rgba(239,68,68,0.08)",
      color: "#b91c1c",
      chipBg: "rgba(239,68,68,0.14)",
      chipColor: "#b91c1c",
    }
    : {
      borderColor: "rgba(245,158,11,0.3)",
      backgroundColor: "rgba(245,158,11,0.08)",
      color: "#b45309",
      chipBg: "rgba(245,158,11,0.16)",
      chipColor: "#b45309",
    };

  return (
    <div
      className="border-b px-4 py-2"
      style={{
        borderColor: palette.borderColor,
        backgroundColor: palette.backgroundColor,
        color: palette.color,
      }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: palette.chipBg, color: palette.chipColor }}
          >
            {style.label}
          </span>
          <span className="truncate">{issue.message}</span>
        </div>
        {issue.kind !== "offline" && (
          <button
            type="button"
            className="shrink-0 text-xs font-semibold underline-offset-2 hover:underline"
            style={{ color: palette.chipColor }}
            onClick={clearIssue}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
