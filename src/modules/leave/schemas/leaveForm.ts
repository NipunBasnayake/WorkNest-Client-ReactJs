import type { LeaveFormErrors, LeaveFormValues } from "@/modules/leave/types";

export const DEFAULT_LEAVE_FORM: LeaveFormValues = {
  leaveType: "ANNUAL",
  startDate: "",
  endDate: "",
  reason: "",
  attachments: [],
};

export function validateLeaveForm(values: LeaveFormValues): LeaveFormErrors {
  const errors: LeaveFormErrors = {};

  if (!values.startDate) {
    errors.startDate = "Start date is required.";
  }

  if (!values.endDate) {
    errors.endDate = "End date is required.";
  }

  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "End date must be later than start date.";
  }

  if (!values.reason.trim()) {
    errors.reason = "Please provide a reason for the leave request.";
  } else if (values.reason.trim().length < 10) {
    errors.reason = "Reason should be at least 10 characters.";
  }

  return errors;
}
