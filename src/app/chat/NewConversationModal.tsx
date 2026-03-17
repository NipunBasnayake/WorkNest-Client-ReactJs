import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getMyTeams } from "@/modules/teams/services/teamService";
import type { ChatType } from "@/modules/chat/types";
import type { Team } from "@/modules/teams/types";
import type { Employee } from "@/types";

interface NewConversationModalProps {
  open: boolean;
  defaultType: ChatType;
  currentUserId: string | undefined;
  currentUserRole: string | undefined;
  onClose: () => void;
  onCreateTeamConversation: (teamId: string) => Promise<void>;
  onCreateHrConversation: (employeeId: string, hrId: string) => Promise<void>;
}

function toRole(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? "";
}

function employeeDisplay(employee: Employee): string {
  const role = toRole(typeof employee.role === "string" ? employee.role : undefined);
  const roleLabel = role ? ` - ${role.replace(/_/g, " ")}` : "";
  return `${employee.name}${employee.email ? ` (${employee.email})` : ""}${roleLabel}`;
}

export function NewConversationModal({
  open,
  defaultType,
  currentUserId,
  currentUserRole,
  onClose,
  onCreateTeamConversation,
  onCreateHrConversation,
}: NewConversationModalProps) {
  const [chatType, setChatType] = useState<ChatType>(defaultType);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedHrId, setSelectedHrId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isCurrentUserHr = toRole(currentUserRole) === "HR";

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return employees;

    return employees.filter((employee) =>
      [employee.name, employee.email ?? "", String(employee.role ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [employees, searchQuery]);

  const hrOptions = useMemo(() => {
    const onlyHr = filteredEmployees.filter((employee) => toRole(String(employee.role ?? "")) === "HR");
    const source = onlyHr.length > 0 ? onlyHr : filteredEmployees;
    return source.filter((employee) => employee.id !== selectedEmployeeId);
  }, [filteredEmployees, selectedEmployeeId]);

  const employeeOptions = useMemo(() => {
    return filteredEmployees.filter((employee) => employee.id !== selectedHrId);
  }, [filteredEmployees, selectedHrId]);

  useEffect(() => {
    if (!open) return;

    setChatType(defaultType);
    setSearchQuery("");
    setLoadingError(null);
    setSubmitError(null);

    let active = true;
    setLoadingOptions(true);

    Promise.allSettled([getMyTeams(), getEmployees()])
      .then(([teamResult, employeeResult]) => {
        if (!active) return;

        const nextTeams = teamResult.status === "fulfilled" ? teamResult.value : [];
        const nextEmployees = employeeResult.status === "fulfilled" ? employeeResult.value : [];

        setTeams(nextTeams);
        setEmployees(nextEmployees);

        setSelectedTeamId(nextTeams[0]?.id ?? "");

        const hrPool = nextEmployees.filter((employee) => toRole(String(employee.role ?? "")) === "HR");

        if (isCurrentUserHr) {
          setSelectedHrId(currentUserId ?? hrPool[0]?.id ?? nextEmployees[0]?.id ?? "");
          const defaultEmployee =
            nextEmployees.find((employee) => employee.id !== currentUserId) ?? nextEmployees[0];
          setSelectedEmployeeId(defaultEmployee?.id ?? "");
        } else {
          setSelectedEmployeeId(currentUserId ?? nextEmployees[0]?.id ?? "");
          const source = hrPool.length > 0 ? hrPool : nextEmployees;
          const defaultHr = source.find((employee) => employee.id !== currentUserId) ?? source[0];
          setSelectedHrId(defaultHr?.id ?? "");
        }

        if (teamResult.status === "rejected" && employeeResult.status === "rejected") {
          setLoadingError("Unable to load teams and employees.");
        }
      })
      .finally(() => {
        if (!active) return;
        setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId, defaultType, isCurrentUserHr, open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open, submitting]);

  if (!open) return null;

  async function handleSubmit() {
    if (submitting) return;

    setSubmitError(null);

    if (chatType === "TEAM") {
      if (!selectedTeamId) {
        setSubmitError("Select a team to start the conversation.");
        return;
      }

      setSubmitting(true);
      try {
        await onCreateTeamConversation(selectedTeamId);
        onClose();
      } catch {
        setSubmitError("Unable to start the team chat right now.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const employeeId = isCurrentUserHr ? selectedEmployeeId : (currentUserId ?? selectedEmployeeId);
    const hrId = isCurrentUserHr ? (currentUserId ?? selectedHrId) : selectedHrId;

    if (!employeeId || !hrId) {
      setSubmitError("Select both the employee and HR representative.");
      return;
    }

    setSubmitting(true);
    try {
      await onCreateHrConversation(employeeId, hrId);
      onClose();
    } catch {
      setSubmitError("Unable to start the HR chat right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => !submitting && onClose()} aria-hidden="true" />

      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border p-5 shadow-2xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              New Chat
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Start a Team or HR conversation and jump in immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border cursor-pointer"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setChatType("TEAM")}
            className="rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
            style={{
              backgroundColor: chatType === "TEAM" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
              color: chatType === "TEAM" ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            Team Chat
          </button>
          <button
            type="button"
            onClick={() => setChatType("HR")}
            className="rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
            style={{
              backgroundColor: chatType === "HR" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
              color: chatType === "HR" ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            HR Chat
          </button>
        </div>

        {loadingError && (
          <div
            className="mb-4 rounded-xl border p-3 text-sm"
            style={{
              borderColor: "rgba(239,68,68,0.3)",
              backgroundColor: "rgba(239,68,68,0.06)",
              color: "#ef4444",
            }}
          >
            {loadingError}
          </div>
        )}

        {chatType === "TEAM" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Team
            </label>
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              disabled={loadingOptions || teams.length === 0 || submitting}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            >
              {teams.length === 0 && <option value="">No teams available</option>}
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {chatType === "HR" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Search People
              </label>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email, or role"
                disabled={loadingOptions || submitting}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {isCurrentUserHr ? (
              <>
                <div className="rounded-xl border p-2.5 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  HR representative: You ({currentUserId ?? "unknown"})
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Employee
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) => setSelectedEmployeeId(event.target.value)}
                    disabled={loadingOptions || employeeOptions.length === 0 || submitting}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
                    style={{
                      borderColor: "var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {employeeOptions.length === 0 && <option value="">No employees found</option>}
                    {employeeOptions.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employeeDisplay(employee)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border p-2.5 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  Employee: You ({currentUserId ?? "unknown"})
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    HR Representative
                  </label>
                  <select
                    value={selectedHrId}
                    onChange={(event) => setSelectedHrId(event.target.value)}
                    disabled={loadingOptions || hrOptions.length === 0 || submitting}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
                    style={{
                      borderColor: "var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {hrOptions.length === 0 && <option value="">No matching users found</option>}
                    {hrOptions.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employeeDisplay(employee)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {submitError && (
          <p className="mt-3 text-sm" style={{ color: "#ef4444" }}>
            {submitError}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-60"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={submitting || loadingOptions}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
            }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Starting..." : "Start Conversation"}
          </button>
        </div>
      </div>
    </div>
  );
}
