import type { PlatformTenantStatus } from "@/types";
import { platformStatusLabel } from "@/modules/platform/status";

const styles: Record<PlatformTenantStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "#059669" },
  PROVISIONING: { label: "Pending setup", color: "#2563eb" },
  SUSPENDED: { label: "Suspended", color: "#dc2626" },
  INACTIVE: { label: "Deactivated", color: "#64748b" },
  ARCHIVED: { label: "Archived", color: "#7c3aed" },
  REJECTED: { label: "Rejected", color: "#b45309" },
};

export function PlatformStatusBadge({ status }: { status?: string | null }) {
  const normalized = String(status ?? "INACTIVE").toUpperCase() as PlatformTenantStatus;
  const meta = styles[normalized] ?? { label: platformStatusLabel(normalized), color: "#64748b" };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${meta.color}14`, color: meta.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
