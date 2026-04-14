import {
  TEAM_MEMBER_FUNCTIONAL_ROLE_LABELS,
  type Team,
  type TeamMemberFunctionalRole,
} from "@/modules/teams/types";

interface ViewerIdentity {
  employeeId?: string;
  email?: string;
}

export const TEAM_ROLE_BADGE_STYLES: Record<TeamMemberFunctionalRole, { background: string; color: string }> = {
  MEMBER: {
    background: "rgba(107,114,128,0.14)",
    color: "#4b5563",
  },
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
  BUSINESS_ANALYST: {
    background: "rgba(236,72,153,0.14)",
    color: "#db2777",
  },
  DEVELOPER: {
    background: "rgba(16,185,129,0.14)",
    color: "#059669",
  },
  DESIGNER: {
    background: "rgba(14,165,233,0.14)",
    color: "#0284c7",
  },
};

export function toTeamRoleLabel(role: TeamMemberFunctionalRole): string {
  return TEAM_MEMBER_FUNCTIONAL_ROLE_LABELS[role] ?? role;
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

    // Team manager should have workflow privileges equivalent to a project manager.
    if (viewerEmployeeId && team.managerEmployeeId && team.managerEmployeeId === viewerEmployeeId) {
      roles.add("PROJECT_MANAGER");
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

      if (matchesViewer && member.isManager) {
        roles.add("PROJECT_MANAGER");
      }
    });
  });

  return Array.from(roles);
}
