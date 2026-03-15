import type { TeamFormErrors, TeamFormValues } from "@/modules/teams/types";

export const DEFAULT_TEAM_FORM: TeamFormValues = {
  name: "",
  description: "",
  managerName: "",
  managerEmployeeId: "",
  memberIds: [],
  status: "active",
};

export function validateTeamForm(values: TeamFormValues): TeamFormErrors {
  const errors: TeamFormErrors = {};

  if (!values.name.trim()) errors.name = "Team name is required.";
  if (!values.managerName.trim()) errors.managerName = "Manager name is required.";

  return errors;
}
