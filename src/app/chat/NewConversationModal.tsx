import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, Loader2, MessageSquarePlus, Search, Users, X } from "lucide-react";
import { listHrConversationTargets } from "@/modules/chat/services/chatService";
import { getMyTeams } from "@/modules/teams/services/teamService";
import type { ChatParticipant, ChatType } from "@/modules/chat/types";
import type { Team } from "@/modules/teams/types";
import { formatTargetLabel, toRole } from "@/app/chat/chatUtils";

interface NewConversationModalProps {
  open: boolean;
  defaultType: ChatType;
  currentEmployeeId: string | undefined;
  currentUserRole: string | undefined;
  onClose: () => void;
  onCreateTeamConversation: (teamId: string) => Promise<void>;
  onCreateHrConversation: (employeeId: string, hrId: string) => Promise<void>;
}

export function NewConversationModal({
  open,
  defaultType,
  currentEmployeeId,
  currentUserRole,
  onClose,
  onCreateTeamConversation,
  onCreateHrConversation,
}: NewConversationModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [chatType, setChatType] = useState<ChatType>(defaultType);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hrTargets, setHrTargets] = useState<ChatParticipant[]>([]);
  const [employeeTargets, setEmployeeTargets] = useState<ChatParticipant[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedHrId, setSelectedHrId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const normalizedRole = toRole(currentUserRole);
  const isHrInitiator = normalizedRole === "HR" || normalizedRole === "ADMIN";

  const filteredTeams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [searchQuery, teams]);

  const filteredHrTargets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const candidates = hrTargets.filter((target) => target.id !== currentEmployeeId);
    if (!query) return candidates;
    return candidates.filter((target) => formatTargetLabel(target).toLowerCase().includes(query));
  }, [currentEmployeeId, hrTargets, searchQuery]);

  const filteredEmployeeTargets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const candidates = employeeTargets.filter((target) => target.id !== currentEmployeeId);
    if (!query) return candidates;
    return candidates.filter((target) => formatTargetLabel(target).toLowerCase().includes(query));
  }, [currentEmployeeId, employeeTargets, searchQuery]);

  useEffect(() => {
    if (!open) return;

    setChatType(defaultType);
    setSearchQuery("");
    setLoadingError(null);
    setSubmitError(null);

    let active = true;
    setLoadingOptions(true);

    Promise.allSettled([getMyTeams(), listHrConversationTargets()])
      .then(([teamResult, targetsResult]) => {
        if (!active) return;

        const nextTeams = teamResult.status === "fulfilled" ? teamResult.value : [];
        const nextHrTargets = targetsResult.status === "fulfilled" ? targetsResult.value.hrTargets : [];
        const nextEmployeeTargets = targetsResult.status === "fulfilled" ? targetsResult.value.employeeTargets : [];

        setTeams(nextTeams);
        setHrTargets(nextHrTargets);
        setEmployeeTargets(nextEmployeeTargets);

        setSelectedTeamId((previous) => {
          if (previous && nextTeams.some((team) => team.id === previous)) return previous;
          return nextTeams[0]?.id ?? "";
        });

        const availableHrTargets = nextHrTargets.filter((target) => target.id !== currentEmployeeId);
        const availableEmployeeTargets = nextEmployeeTargets.filter((target) => target.id !== currentEmployeeId);

        setSelectedHrId((previous) => {
          if (previous && availableHrTargets.some((target) => target.id === previous)) return previous;
          return availableHrTargets[0]?.id ?? "";
        });

        setSelectedEmployeeId((previous) => {
          if (previous && availableEmployeeTargets.some((target) => target.id === previous)) return previous;
          return availableEmployeeTargets[0]?.id ?? "";
        });

        if (teamResult.status === "rejected" && targetsResult.status === "rejected") {
          setLoadingError("Unable to load chat options right now.");
        }
      })
      .finally(() => {
        if (!active) return;
        setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [currentEmployeeId, defaultType, open]);

  useEffect(() => {
    if (!open) return;

    setSelectedTeamId((previous) => {
      if (previous && filteredTeams.some((team) => team.id === previous)) return previous;
      return filteredTeams[0]?.id ?? "";
    });
  }, [filteredTeams, open]);

  useEffect(() => {
    if (!open) return;

    setSelectedHrId((previous) => {
      if (previous && filteredHrTargets.some((target) => target.id === previous)) return previous;
      return filteredHrTargets[0]?.id ?? "";
    });
  }, [filteredHrTargets, open]);

  useEffect(() => {
    if (!open) return;

    setSelectedEmployeeId((previous) => {
      if (previous && filteredEmployeeTargets.some((target) => target.id === previous)) return previous;
      return filteredEmployeeTargets[0]?.id ?? "";
    });
  }, [filteredEmployeeTargets, open]);

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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus='true']");
    target?.focus();
  }, [open, chatType]);

  if (!open) return null;

  const canCreateTeam = filteredTeams.length > 0 && Boolean(selectedTeamId);
  const canCreateHr = isHrInitiator
    ? filteredEmployeeTargets.length > 0 && Boolean(selectedEmployeeId) && Boolean(currentEmployeeId)
    : filteredHrTargets.length > 0 && Boolean(selectedHrId) && Boolean(currentEmployeeId);

  const submitDisabled = submitting || loadingOptions || (chatType === "TEAM" ? !canCreateTeam : !canCreateHr);

  async function handleSubmit() {
    if (submitDisabled) return;

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

    const employeeId = isHrInitiator ? selectedEmployeeId : currentEmployeeId;
    const hrId = isHrInitiator ? currentEmployeeId : selectedHrId;

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

  const searchPlaceholder = chatType === "TEAM" ? "Search teams" : "Search by name, email, or role";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => !submitting && onClose()} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-xl rounded-2xl border p-5 shadow-2xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              New Chat
            </h2>
            <p id={descriptionId} className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
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

        <div className="mb-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Conversation type">
          <button
            type="button"
            role="tab"
            aria-selected={chatType === "TEAM"}
            onClick={() => setChatType("TEAM")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: chatType === "TEAM" ? "rgba(147,50,234,0.32)" : "var(--border-default)",
              backgroundColor: chatType === "TEAM" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
              color: chatType === "TEAM" ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            <Users size={14} />
            Team Chat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chatType === "HR"}
            onClick={() => setChatType("HR")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: chatType === "HR" ? "rgba(147,50,234,0.32)" : "var(--border-default)",
              backgroundColor: chatType === "HR" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
              color: chatType === "HR" ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            <BriefcaseBusiness size={14} />
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

        <div className="mb-4">
          <label className="sr-only" htmlFor="new-chat-search">
            Search options
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            />
            <input
              id="new-chat-search"
              data-autofocus="true"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              disabled={loadingOptions || submitting}
              className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {chatType === "TEAM" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Team
            </label>
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              disabled={loadingOptions || filteredTeams.length === 0 || submitting}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            >
              {filteredTeams.length === 0 && <option value="">No matching teams found</option>}
              {filteredTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {chatType === "HR" && (
          <div className="space-y-3">
            {isHrInitiator ? (
              <>
                <div className="rounded-xl border p-2.5 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  HR representative: You ({currentEmployeeId ?? "unknown"})
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Employee
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) => setSelectedEmployeeId(event.target.value)}
                    disabled={loadingOptions || filteredEmployeeTargets.length === 0 || submitting}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
                    style={{
                      borderColor: "var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {filteredEmployeeTargets.length === 0 && <option value="">No matching employees found</option>}
                    {filteredEmployeeTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {formatTargetLabel(target)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border p-2.5 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  Employee: You ({currentEmployeeId ?? "unknown"})
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    HR Representative
                  </label>
                  <select
                    value={selectedHrId}
                    onChange={(event) => setSelectedHrId(event.target.value)}
                    disabled={loadingOptions || filteredHrTargets.length === 0 || submitting}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
                    style={{
                      borderColor: "var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {filteredHrTargets.length === 0 && <option value="">No matching HR representatives found</option>}
                    {filteredHrTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {formatTargetLabel(target)}
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

        {loadingOptions && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <Loader2 size={14} className="animate-spin" />
            Loading options...
          </div>
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
            disabled={submitDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
            }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquarePlus size={14} />}
            {submitting ? "Starting..." : "Start Conversation"}
          </button>
        </div>
      </div>
    </div>
  );
}
