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
  if (!values.joinedDate) errors.joinedDate = "Joined date is required.";

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
