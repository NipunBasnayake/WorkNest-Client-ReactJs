import type { PlatformTenantStatus } from "@/types";

const labels: Record<PlatformTenantStatus, string> = {
  ACTIVE: "Active",
  PROVISIONING: "Pending setup",
  SUSPENDED: "Suspended",
  INACTIVE: "Deactivated",
  ARCHIVED: "Archived",
  REJECTED: "Rejected",
};

export function platformStatusLabel(status?: string | null) {
  const normalized = String(status ?? "INACTIVE").toUpperCase() as PlatformTenantStatus;
  return labels[normalized] ?? normalized;
}
