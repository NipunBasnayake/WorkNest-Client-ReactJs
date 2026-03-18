import type { TeamFormErrors, TeamFormValues } from "@/modules/teams/types";

export const DEFAULT_TEAM_FORM: TeamFormValues = {
  name: "",
  description: "",
  managerEmployeeId: "",
  memberIds: [],
  status: "active",
};

export function validateTeamForm(values: TeamFormValues): TeamFormErrors {
  const errors: TeamFormErrors = {};

  if (!values.name.trim()) errors.name = "Team name is required.";
  if (!values.managerEmployeeId.trim()) errors.managerEmployeeId = "Manager selection is required.";
  if (values.managerEmployeeId && !values.memberIds.includes(values.managerEmployeeId)) {
    errors.memberIds = "Manager must be included in team members.";
  }

  return errors;
}
