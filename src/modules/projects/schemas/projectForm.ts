import type { ProjectFormErrors, ProjectFormValues } from "@/modules/projects/types";

export const DEFAULT_PROJECT_FORM: ProjectFormValues = {
  name: "",
  description: "",
  status: "planned",
  startDate: "",
  endDate: "",
  progress: "0",
  teamIds: [],
};

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  if (!values.name.trim()) errors.name = "Project name is required.";
  if (!values.startDate) errors.startDate = "Start date is required.";

  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = "End date must be after start date.";
  }

  const progress = Number(values.progress);
  if (Number.isNaN(progress) || progress < 0 || progress > 100) {
    errors.progress = "Progress must be between 0 and 100.";
  }

  return errors;
}
