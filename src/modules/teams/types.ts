export type TeamStatus = "active" | "planning" | "archived";

export const TEAM_MEMBER_FUNCTIONAL_ROLES = [
  "MEMBER",
  "TEAM_LEAD",
  "PROJECT_MANAGER",
  "BUSINESS_ANALYST",
  "DEVELOPER",
  "QA",
  "DESIGNER",
] as const;

export type TeamMemberFunctionalRole = (typeof TEAM_MEMBER_FUNCTIONAL_ROLES)[number];

export const TEAM_MEMBER_FUNCTIONAL_ROLE_LABELS: Record<TeamMemberFunctionalRole, string> = {
  MEMBER: "Member",
  TEAM_LEAD: "Team Lead",
  PROJECT_MANAGER: "Project Manager",
  BUSINESS_ANALYST: "Business Analyst",
  DEVELOPER: "Developer",
  QA: "QA Engineer",
  DESIGNER: "Designer",
};

export interface TeamMember {
  teamMemberId?: string;
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
  memberCount?: number;
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
