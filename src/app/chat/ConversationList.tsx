import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import type { ChatConversation, ChatParticipant, ChatType } from "@/modules/chat/types";
import { listHrConversationTargets } from "@/modules/chat/services/chatService";
import { getMyTeams } from "@/modules/teams/services/teamService";
import type { Team } from "@/modules/teams/types";

interface ConversationListProps {
  activeTab: ChatType;
  searchQuery: string;
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  isLoading: boolean;
  currentEmployeeId: string | undefined;
  currentUserRole: string | undefined;
  onTabChange: (tab: ChatType) => void;
  onSearchChange: (value: string) => void;
  onSelect: (conversationId: string) => void;
  onCreateTeamConversation: (teamId: string) => Promise<void>;
  onCreateHrConversation: (employeeId: string, hrId: string) => Promise<void>;
}

function toRole(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? "";
}

function formatConversationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTargetLabel(target: ChatParticipant): string {
  const role = toRole(target.role);
  const roleLabel = role ? ` - ${role.replace(/_/g, " ")}` : "";
  return `${target.name}${target.email ? ` (${target.email})` : ""}${roleLabel}`;
}

export function ConversationList({
  activeTab,
  searchQuery,
  conversations,
  selectedConversationId,
  isLoading,
  currentEmployeeId,
  currentUserRole,
  onTabChange,
  onSearchChange,
  onSelect,
  onCreateTeamConversation,
  onCreateHrConversation,
}: ConversationListProps) {
  const [showNewChat, setShowNewChat] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hrTargets, setHrTargets] = useState<ChatParticipant[]>([]);
  const [employeeTargets, setEmployeeTargets] = useState<ChatParticipant[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedHrId, setSelectedHrId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedRole = toRole(currentUserRole);
  const isHrInitiator = normalizedRole === "HR" || normalizedRole === "ADMIN";

  const availableHrTargets = useMemo(
    () => hrTargets.filter((target) => target.id !== currentEmployeeId),
    [currentEmployeeId, hrTargets]
  );

  const availableEmployeeTargets = useMemo(
    () => employeeTargets.filter((target) => target.id !== currentEmployeeId),
    [currentEmployeeId, employeeTargets]
  );

  useEffect(() => {
    if (!showNewChat) return;

    let active = true;
    setLoadingOptions(true);
    setSubmitError(null);

    if (activeTab === "TEAM") {
      getMyTeams()
        .then((nextTeams) => {
          if (!active) return;
          setTeams(nextTeams);
          setSelectedTeamId((previous) => {
            if (previous && nextTeams.some((team) => team.id === previous)) return previous;
            return nextTeams[0]?.id ?? "";
          });
        })
        .catch(() => {
          if (!active) return;
          setTeams([]);
          setSelectedTeamId("");
          setSubmitError("Unable to load teams right now.");
        })
        .finally(() => {
          if (active) setLoadingOptions(false);
        });

      return () => {
        active = false;
      };
    }

    listHrConversationTargets()
      .then((targets) => {
        if (!active) return;

        const nextHrTargets = targets.hrTargets.filter((target) => target.id !== currentEmployeeId);
        const nextEmployeeTargets = targets.employeeTargets.filter((target) => target.id !== currentEmployeeId);

        setHrTargets(nextHrTargets);
        setEmployeeTargets(nextEmployeeTargets);

        setSelectedHrId((previous) => {
          if (previous && nextHrTargets.some((target) => target.id === previous)) return previous;
          return nextHrTargets[0]?.id ?? "";
        });

        setSelectedEmployeeId((previous) => {
          if (previous && nextEmployeeTargets.some((target) => target.id === previous)) return previous;
          return nextEmployeeTargets[0]?.id ?? "";
        });

        if (!isHrInitiator && nextHrTargets.length === 0) {
          setSubmitError("No active HR representatives are available in your workspace.");
        } else if (isHrInitiator && nextEmployeeTargets.length === 0) {
          setSubmitError("No active employees are available to start an HR conversation.");
        }
      })
      .catch(() => {
        if (!active) return;
        setHrTargets([]);
        setEmployeeTargets([]);
        setSelectedHrId("");
        setSelectedEmployeeId("");
        setSubmitError("Unable to load HR chat targets right now.");
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, currentEmployeeId, isHrInitiator, showNewChat]);

  async function handleStartChat() {
    if (submitting || loadingOptions) return;
    setSubmitError(null);

    if (activeTab === "TEAM") {
      if (!selectedTeamId) {
        setSubmitError("Select a team first.");
        return;
      }

      setSubmitting(true);
      try {
        await onCreateTeamConversation(selectedTeamId);
        setShowNewChat(false);
      } catch {
        setSubmitError("Unable to start team chat right now.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!currentEmployeeId) {
      setSubmitError("Current employee profile could not be resolved.");
      return;
    }

    setSubmitting(true);
    try {
      if (isHrInitiator) {
        if (!selectedEmployeeId) {
          setSubmitError("Select an employee first.");
          return;
        }

        await onCreateHrConversation(selectedEmployeeId, currentEmployeeId);
      } else {
        if (!selectedHrId) {
          setSubmitError("Select an HR representative first.");
          return;
        }

        await onCreateHrConversation(currentEmployeeId, selectedHrId);
      }

      setShowNewChat(false);
    } catch {
      setSubmitError("Unable to start HR chat right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside
      className="h-full rounded-2xl border p-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <button
        type="button"
        onClick={() => {
          setShowNewChat((previous) => !previous);
          setSubmitError(null);
        }}
        className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
        }}
      >
        <MessageSquarePlus size={16} />
        {showNewChat ? "Close New Chat" : "New Chat"}
      </button>

      {showNewChat && (
        <div
          className="mb-4 space-y-2 rounded-xl border p-3"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-muted)",
          }}
        >
          {activeTab === "TEAM" ? (
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              disabled={loadingOptions || submitting || teams.length === 0}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
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
          ) : (
            <select
              value={isHrInitiator ? selectedEmployeeId : selectedHrId}
              onChange={(event) => {
                if (isHrInitiator) {
                  setSelectedEmployeeId(event.target.value);
                } else {
                  setSelectedHrId(event.target.value);
                }
              }}
              disabled={
                loadingOptions ||
                submitting ||
                (isHrInitiator ? availableEmployeeTargets.length === 0 : availableHrTargets.length === 0)
              }
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            >
              {isHrInitiator && availableEmployeeTargets.length === 0 && (
                <option value="">No active employees available</option>
              )}
              {!isHrInitiator && availableHrTargets.length === 0 && (
                <option value="">No active HR representatives available</option>
              )}
              {(isHrInitiator ? availableEmployeeTargets : availableHrTargets).map((target) => (
                <option key={target.id} value={target.id}>
                  {formatTargetLabel(target)}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              void handleStartChat();
            }}
            disabled={loadingOptions || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
            }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Starting..." : "Start Chat"}
          </button>

          {submitError && (
            <p className="text-xs" style={{ color: "#ef4444" }}>
              {submitError}
            </p>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onTabChange("TEAM")}
          className="rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer transition-colors"
          style={{
            backgroundColor: activeTab === "TEAM" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
            color: activeTab === "TEAM" ? "var(--color-primary-600)" : "var(--text-secondary)",
          }}
        >
          Team Chats
        </button>
        <button
          type="button"
          onClick={() => onTabChange("HR")}
          className="rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer transition-colors"
          style={{
            backgroundColor: activeTab === "HR" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
            color: activeTab === "HR" ? "var(--color-primary-600)" : "var(--text-secondary)",
          }}
        >
          HR Chats
        </button>
      </div>

      <div className="mb-4">
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={activeTab === "TEAM" ? "Search team chats" : "Search HR chats"}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="max-h-[calc(100vh-320px)] space-y-2 overflow-y-auto pr-1">
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`chat-skeleton-${index}`}
              className="h-20 animate-pulse rounded-xl border"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-muted)",
              }}
            />
          ))}

        {!isLoading && conversations.length === 0 && (
          <div
            className="rounded-xl border border-dashed p-4 text-center text-sm"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            No conversations found.
          </div>
        )}

        {!isLoading &&
          conversations.map((conversation) => {
            const selected = selectedConversationId === conversation.id;
            return (
              <button
                key={`${conversation.type}:${conversation.id}`}
                type="button"
                onClick={() => onSelect(conversation.id)}
                className="w-full rounded-xl border p-3 text-left cursor-pointer transition-colors"
                style={{
                  borderColor: selected ? "rgba(147,50,234,0.32)" : "var(--border-default)",
                  backgroundColor: selected ? "rgba(147,50,234,0.08)" : "var(--bg-surface)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {conversation.title}
                    </p>
                    <p className="mt-1 truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                      style={{
                        backgroundColor: "#9332EA",
                        color: "white",
                      }}
                    >
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {formatConversationTime(conversation.lastMessageAt)}
                </p>
              </button>
            );
          })}
      </div>
    </aside>
  );
}
