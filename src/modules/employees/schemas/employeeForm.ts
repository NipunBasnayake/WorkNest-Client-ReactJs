import type { EmployeeFormErrors, EmployeeFormValues } from "@/modules/employees/types";

export const DEFAULT_EMPLOYEE_FORM: EmployeeFormValues = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  position: "",
  department: "",
  role: "EMPLOYEE",
  joinedDate: new Date().toISOString().slice(0, 10),
  salary: "",
  status: "active",
};

export function validateEmployeeForm(values: EmployeeFormValues): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};

  if (!values.firstName.trim()) errors.firstName = "First name is required.";
  if (!values.lastName.trim()) errors.lastName = "Last name is required.";
  if (!values.employeeCode.trim()) errors.employeeCode = "Employee code is required.";
  if (values.employeeCode.trim() && !/^[A-Z0-9-]{3,30}$/.test(values.employeeCode.trim().toUpperCase())) {
    errors.employeeCode = "Use 3-30 characters with letters, numbers, or hyphens.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.password.trim() && values.password.trim().length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!values.position.trim()) errors.position = "Position is required.";
  if (!values.department.trim()) errors.department = "Department is required.";
  if (!values.joinedDate) {
    errors.joinedDate = "Joined date is required.";
  } else {
    const joinedAt = new Date(values.joinedDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (Number.isNaN(joinedAt.getTime())) {
      errors.joinedDate = "Joined date is invalid.";
    } else if (joinedAt.getTime() > today.getTime()) {
      errors.joinedDate = "Joined date cannot be in the future.";
    }
  }

  if (values.phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }

  if (values.salary.trim()) {
    const salary = Number(values.salary);
    if (Number.isNaN(salary) || salary < 0) {
      errors.salary = "Salary must be a valid positive number.";
    }
  }

  return errors;
}
