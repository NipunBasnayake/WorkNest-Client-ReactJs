export type TeamStatus = "active" | "planning" | "archived";

export interface Team {
  id: string;
  name: string;
  description?: string;
  managerName: string;
  managerEmployeeId?: string;
  memberIds: string[];
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormValues {
  name: string;
  description: string;
  managerName: string;
  managerEmployeeId: string;
  memberIds: string[];
  status: TeamStatus;
}

export type TeamFormErrors = Partial<Record<keyof TeamFormValues, string>>;
