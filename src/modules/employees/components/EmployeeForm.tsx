import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import type { EmployeeFormErrors, EmployeeFormValues } from "@/modules/employees/types";

interface EmployeeFormProps {
  values: EmployeeFormValues;
  errors: EmployeeFormErrors;
  submitting: boolean;
  isEdit: boolean;
  submitLabel: string;
  onChange: (next: EmployeeFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EmployeeForm({
  values,
  errors,
  submitting,
  isEdit,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="employee-code"
          label="Employee Code"
          value={values.employeeCode}
          onChange={(e) => onChange({ ...values, employeeCode: e.target.value.toUpperCase() })}
          error={errors.employeeCode}
          placeholder="EMP-1001"
          disabled={isEdit}
          hint={isEdit ? "Employee code is locked after onboarding." : undefined}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="employee-role"
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Role
          </label>
          <select
            id="employee-role"
            value={values.role}
            onChange={(e) => onChange({ ...values, role: e.target.value as EmployeeFormValues["role"] })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="HR">HR</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="employee-first-name"
          label="First Name"
          value={values.firstName}
          onChange={(e) => onChange({ ...values, firstName: e.target.value })}
          error={errors.firstName}
          placeholder="e.g. Alex"
        />
        <Input
          id="employee-last-name"
          label="Last Name"
          value={values.lastName}
          onChange={(e) => onChange({ ...values, lastName: e.target.value })}
          error={errors.lastName}
          placeholder="e.g. Perera"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="employee-email"
          type="email"
          label="Email"
          value={values.email}
          onChange={(e) => onChange({ ...values, email: e.target.value })}
          error={errors.email}
          placeholder="alex@company.com"
        />
        <Input
          id="employee-phone"
          label="Phone"
          value={values.phone}
          onChange={(e) => onChange({ ...values, phone: e.target.value })}
          error={errors.phone}
          placeholder="+94 77 123 4567"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="employee-position"
          label="Designation"
          value={values.position}
          onChange={(e) => onChange({ ...values, position: e.target.value })}
          error={errors.position}
          placeholder="Software Engineer"
        />
        <Input
          id="employee-department"
          label="Department"
          value={values.department}
          onChange={(e) => onChange({ ...values, department: e.target.value })}
          error={errors.department}
          placeholder="Engineering"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="employee-password"
          type="password"
          label="Temporary Password"
          value={values.password}
          onChange={(e) => onChange({ ...values, password: e.target.value })}
          error={errors.password}
          hint={isEdit ? "Optional when editing. Leave blank to keep existing password." : "Optional. If blank, backend default onboarding password will be used."}
          placeholder="Min 8 characters"
        />
        <Input
          id="employee-joined-date"
          type="date"
          label="Joined Date"
          value={values.joinedDate}
          onChange={(e) => onChange({ ...values, joinedDate: e.target.value })}
          error={errors.joinedDate}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="employee-salary"
          label="Salary"
          type="number"
          min={0}
          value={values.salary}
          onChange={(e) => onChange({ ...values, salary: e.target.value })}
          error={errors.salary}
          placeholder="75000"
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="employee-status"
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Status
          </label>
          <select
            id="employee-status"
            value={values.status}
            onChange={(e) => onChange({ ...values, status: e.target.value as EmployeeFormValues["status"] })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
