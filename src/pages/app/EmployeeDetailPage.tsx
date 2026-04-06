import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, BriefcaseBusiness, Building2, CircleAlert, Mail, Phone, Sparkles, UserCheck, UserCog, UserX } from "lucide-react";
import { useParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import {
  addEmployeeSkill,
  deleteEmployeeSkill,
  getEmployeeById,
  getEmployeeSkills,
  updateEmployeeSkill,
  updateEmployeeStatus,
} from "@/modules/employees/services/employeeService";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { toEmployeeViewModel } from "@/modules/employees/utils/employeeMapper";
import type { EmployeeSkill, EmployeeViewModel, SkillLevel } from "@/modules/employees/types";
import { getErrorMessage } from "@/utils/errorHandler";

const SKILL_LEVELS: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

interface SkillEditorState {
  id: string;
  name: string;
  level: SkillLevel;
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  usePageMeta({ title: "Employee Details", breadcrumb: ["Workspace", "Employees", "Details"] });

  const canEdit = hasRole("TENANT_ADMIN", "ADMIN", "HR", "MANAGER");
  const canManageStatus = hasRole("TENANT_ADMIN", "ADMIN", "HR");
  const canManageSkills = hasRole("TENANT_ADMIN", "ADMIN", "HR", "MANAGER");

  const [employee, setEmployee] = useState<EmployeeViewModel | null>(null);
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [skillsLoading, setSkillsLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<"active" | "inactive" | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>("INTERMEDIATE");
  const [skillSubmitting, setSkillSubmitting] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillEditorState | null>(null);
  const [deleteSkillTarget, setDeleteSkillTarget] = useState<EmployeeSkill | null>(null);

  const resolvedError = !id ? "Invalid employee id." : error;
  const isSelfProfile = Boolean(user && employee && (user.id === employee.id || user.email === employee.email));

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
    setStatusLoading(true);
    setMessage(null);
    try {
      await updateEmployeeStatus(id, statusTarget);
      setEmployee((prev) => (prev ? { ...prev, status: statusTarget } : prev));
      setMessage(statusTarget === "inactive" ? "Employee deactivated successfully." : "Employee activated successfully.");
      setStatusTarget(null);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to update employee status."));
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleCreateSkill() {
    if (!id || !newSkillName.trim()) return;
    setSkillSubmitting(true);
    setMessage(null);
    try {
      const created = await addEmployeeSkill(id, { name: newSkillName.trim(), level: newSkillLevel });
      setSkills((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSkillName("");
      setNewSkillLevel("INTERMEDIATE");
      setMessage("Skill added.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Skill add failed. Backend skill mutation may not be enabled."));
    } finally {
      setSkillSubmitting(false);
    }
  }

  async function handleUpdateSkill() {
    if (!id || !editingSkill || !editingSkill.id || !editingSkill.name.trim()) return;
    setSkillSubmitting(true);
    setMessage(null);
    try {
      const updated = await updateEmployeeSkill(id, editingSkill.id, {
        name: editingSkill.name.trim(),
        level: editingSkill.level,
      });
      setSkills((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingSkill(null);
      setMessage("Skill updated.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Skill update failed. Backend skill mutation may not be enabled."));
    } finally {
      setSkillSubmitting(false);
    }
  }

  async function handleDeleteSkill() {
    if (!id || !deleteSkillTarget || !deleteSkillTarget.id) return;
    setSkillSubmitting(true);
    setMessage(null);
    try {
      await deleteEmployeeSkill(id, deleteSkillTarget.id);
      setSkills((prev) => prev.filter((item) => item.id !== deleteSkillTarget.id));
      setDeleteSkillTarget(null);
      setMessage("Skill removed.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Skill deletion failed. Backend skill mutation may not be enabled."));
    } finally {
      setSkillSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" to="/app/employees">
          <ArrowLeft size={16} />
          Back
        </Button>
        {id && canEdit && (
          <Button variant="outline" to={`/app/employees/${id}/edit`}>
            Edit Employee
          </Button>
        )}
        {id && canManageStatus && (
          <Button
            variant={currentStatus === "active" ? "danger" : "outline"}
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
                <AvatarInitials name={employee.displayName} size="lg" />
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
                      style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
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
            action={canManageSkills && !skillsLoading ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                <Sparkles size={12} />
                Skill Management
              </span>
            ) : undefined}
          >
            {skillsError && <ErrorBanner message={skillsError} />}

            {skillsLoading && (
              <div className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
            )}

            {!skillsLoading && (
              <div className="space-y-4">
                {canManageSkills && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto]">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(event) => setNewSkillName(event.target.value)}
                      placeholder="Add skill (e.g. Spring Boot)"
                      className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                    />
                    <select
                      value={newSkillLevel}
                      onChange={(event) => setNewSkillLevel(event.target.value as SkillLevel)}
                      className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                    >
                      {SKILL_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {toReadableLabel(level)}
                        </option>
                      ))}
                    </select>
                    <Button variant="primary" onClick={handleCreateSkill} disabled={skillSubmitting || !newSkillName.trim()}>
                      Add Skill
                    </Button>
                  </div>
                )}

                {!skillsLoading && skills.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No skills assigned yet.
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div
                        key={skill.id || `${skill.name}-${skill.level}`}
                        className="rounded-xl border p-3"
                        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
                      >
                        {editingSkill?.id === skill.id ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_auto_auto]">
                            <input
                              type="text"
                              value={editingSkill.name}
                              onChange={(event) => setEditingSkill((prev) => prev ? { ...prev, name: event.target.value } : prev)}
                              className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                            />
                            <select
                              value={editingSkill.level}
                              onChange={(event) => setEditingSkill((prev) => prev ? { ...prev, level: event.target.value as SkillLevel } : prev)}
                              className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                            >
                              {SKILL_LEVELS.map((level) => (
                                <option key={level} value={level}>{toReadableLabel(level)}</option>
                              ))}
                            </select>
                            <Button variant="outline" size="sm" onClick={handleUpdateSkill} disabled={skillSubmitting || !editingSkill.name.trim()}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingSkill(null)} disabled={skillSubmitting}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{skill.name}</p>
                              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                Level: {toReadableLabel(skill.level)}
                                {skill.yearsOfExperience !== undefined ? ` - ${skill.yearsOfExperience} year(s)` : ""}
                              </p>
                            </div>
                            {canManageSkills && skill.id && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingSkill({ id: skill.id, name: skill.name, level: skill.level })}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setDeleteSkillTarget(skill)}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                            {canManageSkills && !skill.id && (
                              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                Skill is read-only from backend response.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
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

      <ConfirmDialog
        open={Boolean(deleteSkillTarget)}
        title="Remove skill?"
        description={deleteSkillTarget ? `Remove ${deleteSkillTarget.name} from this employee profile.` : ""}
        confirmLabel="Remove Skill"
        loading={skillSubmitting}
        onCancel={() => setDeleteSkillTarget(null)}
        onConfirm={handleDeleteSkill}
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
