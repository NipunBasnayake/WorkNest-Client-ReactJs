import type { Team, TeamMemberFunctionalRole } from "@/modules/teams/types";

interface ViewerIdentity {
  employeeId?: string;
  email?: string;
}

export const TEAM_ROLE_BADGE_STYLES: Record<TeamMemberFunctionalRole, { background: string; color: string }> = {
  PROJECT_MANAGER: {
    background: "rgba(147,50,234,0.14)",
    color: "var(--color-primary-600)",
  },
  TEAM_LEAD: {
    background: "rgba(59,130,246,0.14)",
    color: "#2563eb",
  },
  QA: {
    background: "rgba(245,158,11,0.16)",
    color: "#d97706",
  },
  DEV: {
    background: "rgba(16,185,129,0.14)",
    color: "#059669",
  },
};

export function toTeamRoleLabel(role: TeamMemberFunctionalRole): string {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveViewerTeamRoles(
  teams: Team[],
  viewer: ViewerIdentity,
  scopedTeamIds?: string[]
): TeamMemberFunctionalRole[] {
  const visibleTeamIds = scopedTeamIds ? new Set(scopedTeamIds) : null;
  const viewerEmployeeId = viewer.employeeId?.trim();
  const viewerEmail = viewer.email?.trim().toLowerCase();
  const roles = new Set<TeamMemberFunctionalRole>();

  teams.forEach((team) => {
    if (visibleTeamIds && !visibleTeamIds.has(team.id)) {
      return;
    }

    team.members.forEach((member) => {
      const memberEmail = member.email?.trim().toLowerCase();
      const matchesViewer = Boolean(
        (viewerEmployeeId && member.employeeId === viewerEmployeeId) ||
        (viewerEmail && memberEmail === viewerEmail)
      );

      if (matchesViewer && member.functionalRole) {
        roles.add(member.functionalRole);
      }
    });
  });

  return Array.from(roles);
}
