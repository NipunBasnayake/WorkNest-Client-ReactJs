import type { ProjectFormErrors, ProjectFormValues } from "@/modules/projects/types";

export const DEFAULT_PROJECT_FORM: ProjectFormValues = {
  name: "",
  description: "",
  status: "planned",
  startDate: "",
  endDate: "",
  teamIds: [],
  documents: [],
};

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  if (!values.name.trim()) errors.name = "Project name is required.";
  if (!values.description.trim()) errors.description = "Project description is required.";
  if (!values.startDate) errors.startDate = "Start date is required.";
  if (!values.endDate) errors.endDate = "End date is required.";

  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = "End date must be after start date.";
  }

  return errors;
}
