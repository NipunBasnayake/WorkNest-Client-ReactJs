export type TeamStatus = "active" | "planning" | "archived";

export const TEAM_MEMBER_FUNCTIONAL_ROLES = [
  "TEAM_LEAD",
  "PROJECT_MANAGER",
  "BUSINESS_ANALYST",
  "DEVELOPER",
  "QA_ENGINEER",
] as const;

export type TeamMemberFunctionalRole = (typeof TEAM_MEMBER_FUNCTIONAL_ROLES)[number];

export interface TeamMember {
  employeeId: string;
  name?: string;
  email?: string;
  functionalRole?: TeamMemberFunctionalRole;
  isManager?: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  managerName: string;
  managerEmployeeId?: string;
  members: TeamMember[];
  memberIds: string[];
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormValues {
  name: string;
  description: string;
  managerEmployeeId: string;
  memberIds: string[];
  status: TeamStatus;
}

export type TeamFormErrors = Partial<Record<keyof TeamFormValues, string>>;
