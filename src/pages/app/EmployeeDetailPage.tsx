import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, BriefcaseBusiness, Mail, Phone, DollarSign, CircleAlert } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getEmployeeById } from "@/modules/employees/services/employeeService";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { toEmployeeViewModel } from "@/modules/employees/utils/employeeMapper";
import type { EmployeeViewModel } from "@/modules/employees/types";

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Employee Details", breadcrumb: ["Workspace", "Employees", "Details"] });

  const [employee, setEmployee] = useState<EmployeeViewModel | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const resolvedError = !id ? "Invalid employee id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;

    getEmployeeById(id)
      .then((res) => {
        if (active) setEmployee(toEmployeeViewModel(res));
      })
      .catch(() => {
        if (active) setError("Unable to load employee details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" to="/app/employees">
          <ArrowLeft size={16} />
          Back
        </Button>
        {id && (
          <Button variant="outline" to={`/app/employees/${id}/edit`}>
            Edit Employee
          </Button>
        )}
      </div>

      {loading && (
        <div className="py-24 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
          />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}

      {!loading && !resolvedError && !employee && (
        <EmptyState
          icon={<CircleAlert size={28} />}
          title="Employee not found"
          description="The requested employee profile does not exist or you no longer have access."
          action={<Button variant="outline" to="/app/employees">Go to Employees</Button>}
        />
      )}

      {!loading && !resolvedError && employee && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <AvatarInitials name={employee.displayName} size="lg" />
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {employee.displayName}
                  </h1>
                  <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                    {employee.position ?? "No position set"} · {employee.department ?? "No department"}
                  </p>
                </div>
              </div>
              <StatusBadge status={employee.status ?? "active"} />
            </div>
          </SectionCard>

          <SectionCard title="Contact & Work Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem icon={<Mail size={16} />} label="Email" value={employee.email} />
              <InfoItem icon={<Phone size={16} />} label="Phone" value={employee.phone} />
              <InfoItem icon={<BriefcaseBusiness size={16} />} label="Position" value={employee.position} />
              <InfoItem icon={<Building2 size={16} />} label="Department" value={employee.department} />
              <InfoItem icon={<DollarSign size={16} />} label="Salary" value={employee.salary?.toLocaleString()} />
            </div>
          </SectionCard>

          <div className="flex items-center justify-end">
            <Link
              to={`/app/employees/${employee.id}/edit`}
              className="text-sm font-semibold no-underline"
              style={{ color: "var(--color-primary-600)" }}
            >
              Update Employee Profile
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        <span style={{ color: "var(--color-primary-500)" }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-sm font-medium break-all" style={{ color: "var(--text-primary)" }}>
        {value || "—"}
      </div>
    </div>
  );
}
