import type { Task, TaskStatus } from "@/modules/tasks/types";
import type { TeamMemberFunctionalRole } from "@/modules/teams/types";

export type TaskActorRole = string | null | undefined;

const TEAM_ASSIGNMENT_ROLES = new Set<TeamMemberFunctionalRole>(["TEAM_LEAD", "PROJECT_MANAGER"]);

const ADMIN_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  TODO: ["TODO", "IN_PROGRESS"],
  IN_PROGRESS: ["IN_PROGRESS", "TODO", "IN_REVIEW"],
  IN_REVIEW: ["IN_REVIEW", "IN_PROGRESS", "DONE", "BLOCKED"],
  BLOCKED: ["BLOCKED", "IN_REVIEW"],
  DONE: ["DONE", "IN_REVIEW"],
};

const ASSIGNEE_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  TODO: ["TODO", "IN_PROGRESS"],
  IN_PROGRESS: ["IN_PROGRESS", "TODO", "IN_REVIEW"],
  IN_REVIEW: ["IN_REVIEW", "IN_PROGRESS"],
};

export function isTeamTask(task: Task): boolean {
  return Boolean(task.assignedTeamId);
}

export function isTaskDirectAssignee(task: Task, employeeId?: string | null): boolean {
  if (!employeeId) return false;
  return Boolean(task.assignedEmployeeId === employeeId || task.assigneeEmployeeId === employeeId || task.assigneeId === employeeId);
}

export function hasTeamWorkflowAccess(teamRoles: TeamMemberFunctionalRole[]): boolean {
  return teamRoles.some((role) => TEAM_ASSIGNMENT_ROLES.has(role));
}

function hasProjectManagerAccess(teamRoles: TeamMemberFunctionalRole[]): boolean {
  return teamRoles.includes("PROJECT_MANAGER");
}

export function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "Review",
    BLOCKED: "Blocked",
    DONE: "Done",
  };
  return labels[status];
}

export function getTaskAllowedStatuses(
  task: Task,
  actorRole: TaskActorRole,
  teamRoles: TeamMemberFunctionalRole[],
  isDirectAssignee: boolean
): TaskStatus[] {
  if (actorRole === "TENANT_ADMIN" || actorRole === "ADMIN" || hasProjectManagerAccess(teamRoles)) {
    return ADMIN_TRANSITIONS[task.status] ?? [task.status];
  }

  if (isDirectAssignee) {
    return ASSIGNEE_TRANSITIONS[task.status] ?? [task.status];
  }

  return [task.status];
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
