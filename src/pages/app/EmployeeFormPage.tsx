import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { createEmployee, DEFAULT_EMPLOYEE_TEMP_PASSWORD, getEmployeeById, updateEmployee } from "@/modules/employees/services/employeeService";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import { EmployeeForm } from "@/modules/employees/components/EmployeeForm";
import { DEFAULT_EMPLOYEE_FORM, validateEmployeeForm } from "@/modules/employees/schemas/employeeForm";
import { generateEmployeeCode, toEmployeeFormValues, toEmployeePayload } from "@/modules/employees/utils/employeeMapper";
import type { EmployeeFormErrors, EmployeeFormValues } from "@/modules/employees/types";

export function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  usePageMeta({
    title: isEdit ? "Edit Employee" : "Add Employee",
    breadcrumb: ["Workspace", "Employees", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<EmployeeFormValues>(() => ({
    ...DEFAULT_EMPLOYEE_FORM,
    employeeCode: generateEmployeeCode(),
  }));
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    getEmployeeById(id)
      .then((res) => {
        if (active) setForm(toEmployeeFormValues(res));
      })
      .catch(() => {
        if (active) setFatalError("Unable to load employee for editing.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? "Update Employee" : "Create Employee"), [isEdit]);

  async function handleSubmit() {
    setMessage(null);
    const validation = validateEmployeeForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const payload = toEmployeePayload(form);
      if (id) {
        await updateEmployee(id, payload);
        setMessage("Employee details updated successfully.");
      } else {
        await createEmployee(payload);
        setMessage("Employee created successfully.");
      }

      setTimeout(() => {
        navigate("/app/employees", { replace: true });
      }, 500);
    } catch (err: unknown) {
      setMessage(extractErrorMessage(err) ?? "Failed to save employee. Please verify details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Capture core employee profile data and keep your workforce records up to date."
        actions={(
          <Button variant="ghost" onClick={() => navigate("/app/employees")}>
            <ArrowLeft size={16} />
            Back to Employees
          </Button>
        )}
      />

      {loading && (
        <div className="py-20 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
          />
        </div>
      )}

      {!loading && fatalError && <ErrorBanner message={fatalError} />}

      {!loading && !fatalError && (
        <SectionCard
          title={isEdit ? "Edit Employee Record" : "New Employee Record"}
          subtitle="Fields marked by validation are required before submission."
          action={!isEdit ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ color: "var(--color-primary-600)", borderColor: "rgba(147,50,234,0.25)", background: "rgba(147,50,234,0.08)" }}
            >
              <UserPlus size={12} />
              New Hire
            </span>
          ) : undefined}
        >
          {!isEdit && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-xs"
              style={{
                borderColor: "rgba(147,50,234,0.25)",
                backgroundColor: "rgba(147,50,234,0.08)",
                color: "var(--text-secondary)",
              }}
            >
              Onboarding note: if no temporary password is provided, backend default <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{DEFAULT_EMPLOYEE_TEMP_PASSWORD}</span> is applied.
            </div>
          )}

          {message && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: message.toLowerCase().includes("failed") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
                backgroundColor: message.toLowerCase().includes("failed") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
                color: message.toLowerCase().includes("failed") ? "#ef4444" : "#10b981",
              }}
            >
              {message}
            </div>
          )}

          <EmployeeForm
            values={form}
            errors={errors}
            submitting={submitting}
            isEdit={isEdit}
            submitLabel={isEdit ? "Save Changes" : "Create Employee"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/employees")}
          />
        </SectionCard>
      )}
    </div>
  );
}

function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    return error.response?.data?.message ?? error.message ?? null;
  }
  return null;
}
