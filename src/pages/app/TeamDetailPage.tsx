import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Users, UserCircle2, BriefcaseBusiness } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import {
  addTeamMember,
  getTeamById,
  removeTeamMember,
  updateTeamMemberFunctionalRole,
} from "@/modules/teams/services/teamService";
import { TEAM_MEMBER_FUNCTIONAL_ROLES, type Team, type TeamMember, type TeamMemberFunctionalRole } from "@/modules/teams/types";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getProjects } from "@/modules/projects/services/projectService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { getEmployeeDisplayName } from "@/modules/employees/utils/employeeMapper";
import { TEAM_ROLE_BADGE_STYLES, toTeamRoleLabel } from "@/modules/teams/utils/teamRoles";
import { getTeamMemberCount } from "@/modules/teams/utils/memberCount";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Employee } from "@/types";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import { getErrorMessage } from "@/utils/errorHandler";

type RoleDraftValue = TeamMemberFunctionalRole | "";

function memberRowId(member: TeamMember): string {
  return member.teamMemberId ?? member.employeeId;
}

function extractRoleTokens(value: unknown): string[] {
  if (typeof value === "string") {
    const token = value.trim().toUpperCase();
    return token ? [token] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractRoleTokens(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [
      ...extractRoleTokens(record["role"]),
      ...extractRoleTokens(record["name"]),
      ...extractRoleTokens(record["code"]),
      ...extractRoleTokens(record["value"]),
      ...extractRoleTokens(record["authority"]),
      ...extractRoleTokens(record["type"]),
    ];
  }

  return [];
}

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role, user } = useAuth();
  const { hasPermission } = usePermission();
  usePageMeta({ title: "Team Details", breadcrumb: ["Workspace", "Teams", "Details"] });

  const canManageTeam = hasPermission(PERMISSIONS.TEAMS_MANAGE);
  const isEmployeeOnly = role === "EMPLOYEE" && !canManageTeam;

  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [memberToAdd, setMemberToAdd] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, RoleDraftValue>>({});
  const [roleUpdateLoadingId, setRoleUpdateLoadingId] = useState<string | null>(null);

  const resolvedError = !id ? "Invalid team id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getTeamById(id),
      getEmployees().catch(() => []),
      getProjects().catch(() => []),
      getTasks().catch(() => []),
    ])
      .then(([teamRes, employeeRes, projectRes, taskRes]) => {
        if (!active) return;
        applyTeam(teamRes, setTeam, setRoleDrafts);
        setEmployees(employeeRes);
        setProjects(projectRes);
        setTasks(taskRes);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, "Unable to load team details."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const resolvedMembers = useMemo(() => {
    if (!team) return [];
    return team.members.map((member) => {
      const employee = employeeMap.get(member.employeeId);
      const name = member.name ?? (employee ? getEmployeeDisplayName(employee) : member.employeeId);
      const email = member.email ?? (typeof employee?.email === "string" ? employee.email : "");
      const isManager = Boolean(member.isManager || (team.managerEmployeeId && member.employeeId === team.managerEmployeeId));
      return {
        ...member,
        name,
        email,
        isManager,
      };
    });
  }, [employeeMap, team]);

  const assignedProjects = useMemo(() => {
    if (!team) return [];
    return projects.filter((project) => project.teamIds.includes(team.id));
  }, [projects, team]);

  const teamTasks = useMemo(() => {
    if (!team) return [];
    const memberSet = new Set(team.memberIds);
    return tasks.filter((task) => (task.assigneeId ? memberSet.has(task.assigneeId) : false));
  }, [tasks, team]);

  const viewerEmployeeId = useMemo(() => {
    if (!user) return "";
    const fromEmployees = employees.find((employee) => employee.email?.toLowerCase() === user.email?.toLowerCase());
    return fromEmployees?.id ?? user.id;
  }, [employees, user]);

  const employeeCanViewTeam = useMemo(() => {
    if (!team || !isEmployeeOnly) return true;
    const viewerEmail = user?.email?.toLowerCase();
    return Boolean(
      (viewerEmployeeId && team.memberIds.includes(viewerEmployeeId)) ||
      (viewerEmployeeId && team.managerEmployeeId === viewerEmployeeId) ||
      (viewerEmail && resolvedMembers.some((member) => member.email?.toLowerCase() === viewerEmail))
    );
  }, [isEmployeeOnly, resolvedMembers, team, user?.email, viewerEmployeeId]);

  const availableMembersToAdd = useMemo(() => {
    if (!team) return [];
    const assigned = new Set(team.memberIds);
    return employees.filter((employee) => {
      const roleCandidates = [
        employee.role,
        employee["userRole"],
        employee["tenantRole"],
        employee["roleName"],
        employee["employeeRole"],
        employee["user"],
      ]
        .flatMap((value) => extractRoleTokens(value))
        .filter(Boolean);

      const isHrEmployee = roleCandidates.some((value) => value === "HR" || value.endsWith("_HR") || value === "ROLE_HR");
      return !assigned.has(employee.id) && !isHrEmployee;
    });
  }, [employees, team]);

  const managerProfile = useMemo(() => {
    if (!team?.managerEmployeeId) return null;
    return employeeMap.get(team.managerEmployeeId) ?? null;
  }, [employeeMap, team?.managerEmployeeId]);

  async function refreshTeam() {
    if (!id) return;
    const nextTeam = await getTeamById(id);
    applyTeam(nextTeam, setTeam, setRoleDrafts);
  }

  async function handleAddMember() {
    if (!id || !memberToAdd || !canManageTeam) return;
    if (!availableMembersToAdd.some((employee) => employee.id === memberToAdd)) {
      setMessage("Selected employee cannot be added to this team.");
      return;
    }

    setAddLoading(true);
    setMessage(null);
    try {
      await addTeamMember(id, memberToAdd);
      await refreshTeam();
      setMessage("Team member added.");
      setMemberToAdd("");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to add member."));
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveMember() {
    if (!id || !removeTarget || !canManageTeam) return;
    if (team?.managerEmployeeId && removeTarget.employeeId === team.managerEmployeeId) {
      setMessage("Reassign the manager before removing this member.");
      setRemoveTarget(null);
      return;
    }

    setRemoveLoading(true);
    setMessage(null);
    try {
      await removeTeamMember(id, removeTarget.employeeId, removeTarget.teamMemberId);
      await refreshTeam();
      setMessage("Team member removed.");
      setRemoveTarget(null);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to remove member."));
    } finally {
      setRemoveLoading(false);
    }
  }

  async function handleRoleUpdate(member: TeamMember) {
    if (!id || !canManageTeam) return;
    const rowId = memberRowId(member);
    const nextRole = roleDrafts[rowId] || null;
    const currentRole = member.functionalRole ?? null;
    if (nextRole === currentRole) return;

    setRoleUpdateLoadingId(rowId);
    setMessage(null);
    try {
      await updateTeamMemberFunctionalRole(id, member.employeeId, member.teamMemberId, nextRole);
      await refreshTeam();
      setMessage("Member functional role updated.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to update functional role."));
    } finally {
      setRoleUpdateLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/teams">
          <ArrowLeft size={16} />
          Back
        </Button>
        {team && canManageTeam && (
          <Button variant="outline" to={`/app/teams/${team.id}/edit`}>Edit Team</Button>
        )}
      </div>

      {message && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: message.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
          }}
        >
          {message}
        </div>
      )}

      {loading && (
        <div className="py-24 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
          />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}

      {!loading && !resolvedError && !team && (
        <EmptyState
          icon={<Users size={28} />}
          title="Team not found"
          description="The requested team does not exist."
          action={<Button variant="outline" to="/app/teams">Go to Teams</Button>}
        />
      )}

      {!loading && !resolvedError && team && !employeeCanViewTeam && (
        <EmptyState
          icon={<Users size={28} />}
          title="Access restricted"
          description="You can only view teams where you are assigned."
          action={<Button variant="outline" to="/app/teams">Go to My Teams</Button>}
        />
      )}

      {!loading && !resolvedError && team && employeeCanViewTeam && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {team.name}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {team.description || "No description provided."}
                </p>
              </div>
              <StatusBadge status={team.status} />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard title="Team Manager">
              <div className="flex items-center gap-3">
                <AvatarInitials name={team.managerName || "Manager"} size="sm" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {team.managerName || "-"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {managerProfile?.email || "Manager details unavailable"}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Member Count">
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: "var(--color-primary-500)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{getTeamMemberCount(team)}</span>
              </div>
            </SectionCard>

            <SectionCard title="Workspace Scope">
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <BriefcaseBusiness size={16} style={{ color: "var(--color-primary-500)" }} />
                {assignedProjects.length} linked project{assignedProjects.length === 1 ? "" : "s"} and {teamTasks.length} assigned task{teamTasks.length === 1 ? "" : "s"}.
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Assigned Projects" subtitle="Projects currently linked to this team.">
            {assignedProjects.length === 0 && (
              <EmptyState
                icon={<BriefcaseBusiness size={22} />}
                title="No projects linked"
                description="Assign this team to projects to activate cross-module workflow."
              />
            )}

            {assignedProjects.length > 0 && (
              <div className="space-y-2">
                {assignedProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {project.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {project.status.replace("_", " ")}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" to={`/app/projects/${project.id}`}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div id="members">
            <SectionCard title="Team Members" subtitle="Current members assigned to this team.">
            {canManageTeam && (
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <AppSelect
                  value={memberToAdd}
                  onChange={(event) => setMemberToAdd(event.target.value)}
                  disabled={availableMembersToAdd.length === 0}
                >
                  <option value="">
                    {availableMembersToAdd.length === 0 ? "All employees are already assigned" : "Select employee to add"}
                  </option>
                  {availableMembersToAdd.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {getEmployeeDisplayName(employee)}
                    </option>
                  ))}
                </AppSelect>
                <Button variant="primary" onClick={handleAddMember} disabled={!memberToAdd || addLoading}>
                  {addLoading ? "Adding..." : "Add Member"}
                </Button>
              </div>
            )}

            {resolvedMembers.length === 0 && (
              <EmptyState
                icon={<UserCircle2 size={24} />}
                title="No members yet"
                description={canManageTeam ? "Add members to define this team structure." : "No members are currently assigned."}
              />
            )}

            {resolvedMembers.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {resolvedMembers.map((member) => {
                  const rowId = memberRowId(member);
                  const roleDraft = roleDrafts[rowId] ?? "";
                  const roleLabel = member.functionalRole ? toTeamRoleLabel(member.functionalRole) : "Role not set";
                  const roleBadgeStyle = member.functionalRole ? TEAM_ROLE_BADGE_STYLES[member.functionalRole] : null;
                  const isRoleDirty = (roleDraft || null) !== (member.functionalRole ?? null);

                  return (
                    <div
                      key={rowId}
                      className="rounded-xl border p-3"
                      style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <AvatarInitials name={member.name || member.employeeId} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                              {member.name || member.employeeId}
                            </div>
                            <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                              {member.email || "No email available"}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {member.isManager && (
                                <span
                                  className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                  style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
                                >
                                  Manager
                                </span>
                              )}
                              <span
                                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={roleBadgeStyle ?? { background: "rgba(99,102,241,0.12)", color: "#6366f1" }}
                              >
                                {roleLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {canManageTeam && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <AppSelect
                              value={roleDraft}
                              onChange={(event) =>
                                setRoleDrafts((prev) => ({
                                  ...prev,
                                  [rowId]: event.target.value as RoleDraftValue,
                                }))
                              }
                            >
                              <option value="">No functional role</option>
                              {TEAM_MEMBER_FUNCTIONAL_ROLES.map((role) => (
                                <option key={role} value={role}>{toTeamRoleLabel(role)}</option>
                              ))}
                            </AppSelect>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRoleUpdate(member)}
                              disabled={roleUpdateLoadingId === rowId || !isRoleDirty}
                            >
                              {roleUpdateLoadingId === rowId ? "Saving..." : "Save Role"}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setRemoveTarget(member)}
                              disabled={Boolean(member.isManager)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </SectionCard>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove team member?"
        description={
          removeTarget
            ? `Remove ${removeTarget.name || removeTarget.employeeId} from this team.`
            : ""
        }
        confirmLabel="Remove"
        loading={removeLoading}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
      />
    </div>
  );
}

function applyTeam(
  team: Team,
  setTeam: (value: Team) => void,
  setRoleDrafts: (updater: Record<string, RoleDraftValue>) => void
) {
  setTeam(team);
  const drafts: Record<string, RoleDraftValue> = {};
  for (const member of team.members) {
    drafts[memberRowId(member)] = member.functionalRole ?? "";
  }
  setRoleDrafts(drafts);
}
