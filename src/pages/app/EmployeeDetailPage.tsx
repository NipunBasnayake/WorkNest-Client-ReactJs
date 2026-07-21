import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BriefcaseBusiness, Building2, CircleAlert, Mail, Phone, Sparkles, UserCheck, UserCog, UserX } from "lucide-react";
import { useParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import {
  getEmployeeById,
  getEmployeeSkills,
  updateEmployeeStatus,
} from "@/modules/employees/services/employeeService";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { AvatarUploadField } from "@/components/common/AvatarUploadField";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { toEmployeeViewModel } from "@/modules/employees/utils/employeeMapper";
import type { EmployeeSkill, EmployeeViewModel } from "@/modules/employees/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { deleteEmployeeAvatarApi, uploadEmployeeAvatarApi } from "@/services/api/employeeApi";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  usePageMeta({ title: "Employee Details", breadcrumb: ["Workspace", "Employees", "Details"] });

  const canEdit = hasPermission(PERMISSIONS.EMPLOYEES_MANAGE);
  const canManageStatus = hasPermission(PERMISSIONS.EMPLOYEE_STATUS_MANAGE);

  const [employee, setEmployee] = useState<EmployeeViewModel | null>(null);
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [skillsLoading, setSkillsLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<"active" | "inactive" | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const resolvedError = !id ? "Invalid employee id." : error;
  const isSelfProfile = Boolean(user && employee && (
    user.id === employee.id
    || String(employee.platformUserId ?? "") === String(user.id)
    || user.email?.trim().toLowerCase() === employee.email?.trim().toLowerCase()
  ));

  useEffect(() => {
    if (!id) return;
    let active = true;

    setLoading(true);
    setError(null);

    getEmployeeById(id)
      .then((res) => {
        if (active) setEmployee(toEmployeeViewModel(res));
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, "Unable to load employee details."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    setSkillsLoading(true);
    setSkillsError(null);

    getEmployeeSkills(id)
      .then((items) => {
        if (active) setSkills(items);
      })
      .catch((err: unknown) => {
        if (active) setSkillsError(getErrorMessage(err, "Unable to load employee skills."));
      })
      .finally(() => {
        if (active) setSkillsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const currentStatus = useMemo(() => {
    if (!employee) return "active";
    return String(employee.status ?? "active").toLowerCase() === "inactive" ? "inactive" : "active";
  }, [employee]);

  async function handleStatusUpdate() {
    if (!id || !employee || !statusTarget) return;
    if (statusTarget === "inactive" && isSelfProfile) {
      setMessage("You cannot deactivate your own account.");
      setStatusTarget(null);
      return;
    }
    setStatusLoading(true);
    setMessage(null);
    try {
      await updateEmployeeStatus(id, statusTarget);
      setEmployee((prev) => (prev ? { ...prev, status: statusTarget } : prev));
      await invalidateWorkflowQueries(queryClient, ["employees"]);
      setMessage(statusTarget === "inactive" ? "Employee deactivated successfully." : "Employee activated successfully.");
      setStatusTarget(null);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to update employee status."));
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAvatarUpload(file: File, options: ImageUploadRequestOptions) {
    if (!id) return;
    const result = await uploadEmployeeAvatarApi(id, file, options);
    const avatarUrl = result.variants?.["128"] ?? result.avatarUrl ?? undefined;
    setEmployee((previous) => previous ? { ...previous, avatarUrl } : previous);
    await invalidateWorkflowQueries(queryClient, ["employees", "teams", "tasks"]);
    setMessage("Employee profile picture updated.");
  }

  async function handleAvatarRemove() {
    if (!id) return;
    await deleteEmployeeAvatarApi(id);
    setEmployee((previous) => previous ? { ...previous, avatarUrl: undefined } : previous);
    await invalidateWorkflowQueries(queryClient, ["employees", "teams", "tasks"]);
    setMessage("Employee profile picture removed.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" to={tenantRoutes.employees()}>
          <ArrowLeft size={16} />
          Back
        </Button>
        {id && canEdit && (
          <Button variant="outline" to={tenantRoutes.employeeEdit(id ?? "")}>
            Edit Employee
          </Button>
        )}
        {id && canManageStatus && (
          <Button
            variant={currentStatus === "active" ? "danger" : "outline"}
            disabled={currentStatus === "active" && isSelfProfile}
            title={currentStatus === "active" && isSelfProfile ? "You cannot deactivate your own account" : undefined}
            onClick={() => setStatusTarget(currentStatus === "active" ? "inactive" : "active")}
          >
            {currentStatus === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
            {currentStatus === "active" ? "Deactivate" : "Activate"}
          </Button>
        )}
      </div>

      {loading && (
        <div className="py-24 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "var(--brand-action)", borderLeftColor: "var(--brand-border)" }}
          />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}

      {!loading && !resolvedError && !employee && (
        <EmptyState
          icon={<CircleAlert size={28} />}
          title="Employee not found"
          description="The requested employee profile does not exist or you no longer have access."
          action={<Button variant="outline" to={tenantRoutes.employees()}>Go to Employees</Button>}
        />
      )}

      {message && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
          }}
        >
          {message}
        </div>
      )}

      {!loading && !resolvedError && employee && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <UserAvatar name={employee.displayName} email={employee.email} src={employee.avatarUrl} size="lg" eager />
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {employee.displayName}
                  </h1>
                  <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                    {employee.position ?? employee.designation ?? "No designation"} - {employee.department ?? "No department"}
                  </p>
                  {isSelfProfile && (
                    <span
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: "var(--brand-soft)", color: "var(--color-primary-600)" }}
                    >
                      <UserCog size={12} />
                      This is your employee record
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={currentStatus} />
            </div>
          </SectionCard>

          {canEdit ? (
            <SectionCard title="Profile picture" subtitle="Manage the canonical employee avatar used throughout this tenant.">
              <AvatarUploadField name={employee.displayName} email={employee.email} src={employee.avatarUrl} onUpload={handleAvatarUpload} onRemove={handleAvatarRemove} />
            </SectionCard>
          ) : null}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SectionCard title="Basic Information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Employee Code" value={employee.employeeCode} />
                <InfoItem label="Role" value={toReadableLabel(String(employee.role ?? "EMPLOYEE"))} />
                <InfoItem label="Designation" value={employee.position ?? employee.designation} />
                <InfoItem label="Department" value={employee.department} />
                <InfoItem label="Joined Date" value={formatDate(employee.joinedAt || employee.joinedDate)} />
                <InfoItem label="Status" value={toReadableLabel(currentStatus)} />
              </div>
            </SectionCard>

            <SectionCard title="Contact Information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem icon={<Mail size={16} />} label="Email" value={employee.email} />
                <InfoItem icon={<Phone size={16} />} label="Phone" value={employee.phone} />
                <InfoItem icon={<Building2 size={16} />} label="Department" value={employee.department} />
                <InfoItem icon={<BriefcaseBusiness size={16} />} label="Designation" value={employee.position ?? employee.designation} />
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Employee Skills"
            subtitle="Technical capability profile for project and team allocation."
            action={canEdit && id && !skillsLoading ? (
              <Button variant="outline" size="sm" to={tenantRoutes.employeeEdit(id)}>
                <Sparkles size={14} />
                Edit skills
              </Button>
            ) : undefined}
          >
            {skillsError && <ErrorBanner message={skillsError} />}

            {skillsLoading && (
              <div className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
            )}

            {!skillsLoading && (
              <div>
                {skills.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No skills assigned yet.
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2" aria-label="Employee skills">
                    {skills.map((skill) => (
                      <span
                        key={skill.id || skill.name}
                        className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
                        style={{
                          backgroundColor: "var(--brand-soft)",
                          borderColor: "var(--brand-border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </>
      )}

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={`${statusTarget === "inactive" ? "Deactivate" : "Activate"} employee?`}
        description={
          employee
            ? `${statusTarget === "inactive" ? "Deactivate" : "Activate"} ${employee.displayName} (${employee.employeeCode || "no code"}).`
            : ""
        }
        confirmLabel={statusTarget === "inactive" ? "Deactivate" : "Activate"}
        loading={statusLoading}
        onCancel={() => setStatusTarget(null)}
        onConfirm={handleStatusUpdate}
      />

    </div>
  );
}

function InfoItem({ icon, label, value }: { icon?: ReactNode; label: string; value?: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        {icon && <span style={{ color: "var(--color-primary-500)" }}>{icon}</span>}
        {label}
      </div>
      <div className="mt-2 text-sm font-medium break-all" style={{ color: "var(--text-primary)" }}>
        {value || "-"}
      </div>
    </div>
  );
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function toReadableLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
