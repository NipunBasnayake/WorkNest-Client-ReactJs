import type { Task, TaskStatus } from "@/modules/tasks/types";
import type { TeamMemberFunctionalRole } from "@/modules/teams/types";

export type TaskActorRole = string | null | undefined;

const TEAM_WORKFLOW_ROLES = new Set<TeamMemberFunctionalRole>(["TEAM_LEAD", "PROJECT_MANAGER"]);
const FINAL_REVIEW_STATUS: TaskStatus = "IN_REVIEW";

export function isTeamTask(task: Task): boolean {
  return Boolean(task.assignedTeamId);
}

export function isTaskDirectAssignee(task: Task, employeeId?: string | null): boolean {
  if (!employeeId) return false;
  return Boolean(task.assignedEmployeeId === employeeId || task.assigneeEmployeeId === employeeId || task.assigneeId === employeeId);
}

export function hasTeamWorkflowAccess(teamRoles: TeamMemberFunctionalRole[]): boolean {
  return teamRoles.some((role) => TEAM_WORKFLOW_ROLES.has(role));
}

export function getTaskStatusLabel(status: TaskStatus): string {
  if (status === FINAL_REVIEW_STATUS) {
    return "Waiting for Admin Review";
  }
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getTaskAllowedStatuses(
  task: Task,
  actorRole: TaskActorRole,
  teamRoles: TeamMemberFunctionalRole[],
  isDirectAssignee: boolean
): TaskStatus[] {
  if (actorRole === "TENANT_ADMIN") {
    return task.status === "TODO"
      ? ["TODO", "IN_PROGRESS"]
      : task.status === "IN_PROGRESS"
        ? ["IN_PROGRESS", "TODO", "IN_REVIEW"]
        : task.status === "IN_REVIEW"
          ? ["IN_REVIEW", "DONE", "BLOCKED"]
          : task.status === "DONE"
            ? ["DONE", "IN_REVIEW"]
            : task.status === "BLOCKED"
              ? ["BLOCKED", "IN_REVIEW"]
          : [task.status];
  }

  if (isTeamTask(task)) {
    if (!hasTeamWorkflowAccess(teamRoles)) {
      return [task.status];
    }

    return task.status === "TODO"
      ? ["TODO", "IN_PROGRESS"]
      : task.status === "IN_PROGRESS"
        ? ["IN_PROGRESS", "TODO", "IN_REVIEW"]
        : task.status === "IN_REVIEW"
          ? ["IN_REVIEW", "IN_PROGRESS"]
        : [task.status];
  }

  if (!isDirectAssignee) {
    return [task.status];
  }

  return task.status === "TODO"
    ? ["TODO", "IN_PROGRESS"]
    : task.status === "IN_PROGRESS"
      ? ["IN_PROGRESS", "IN_REVIEW"]
      : task.status === "IN_REVIEW"
        ? ["IN_REVIEW", "DONE"]
        : [task.status];
}

export function canMoveTaskToStatus(
  task: Task,
  actorRole: TaskActorRole,
  teamRoles: TeamMemberFunctionalRole[],
  isDirectAssignee: boolean,
  nextStatus: TaskStatus
): boolean {
  return getTaskAllowedStatuses(task, actorRole, teamRoles, isDirectAssignee).includes(nextStatus);
}
