import type { Team } from "@/modules/teams/types";

export function getTeamMemberCount(team: Team | null | undefined): number {
  if (!team) return 0;

  const memberIds = new Set<string>();

  (team.memberIds ?? []).forEach((memberId) => {
    if (memberId) memberIds.add(memberId);
  });

  (team.members ?? []).forEach((member) => {
    if (member.employeeId) memberIds.add(member.employeeId);
  });

  if (team.managerEmployeeId) {
    memberIds.add(team.managerEmployeeId);
  }

  const derivedCount = memberIds.size;
  if (typeof team.memberCount === "number" && Number.isFinite(team.memberCount) && team.memberCount >= 0) {
    return Math.max(team.memberCount, derivedCount);
  }

  return derivedCount;
}