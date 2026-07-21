import { BriefcaseBusiness, Loader2, Search, Users, X } from "lucide-react";
import type { ChatConversation } from "@/modules/chat/types";
import { buildConversationKey, formatConversationTime } from "@/app/chat/chatUtils";
import { UserAvatar } from "@/components/common/UserAvatar";

interface ConversationListProps {
  searchQuery: string;
  teamConversations: ChatConversation[];
  hrConversations: ChatConversation[];
  selectedConversationKey: string | null;
  isLoading: boolean;
  canOpenHrSupport: boolean;
  isOpeningHrSupport: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (conversation: ChatConversation) => void;
  onOpenHrSupport: () => void;
}

function matchesQuery(conversation: ChatConversation, query: string): boolean {
  if (!query) return true;
  return [conversation.title, conversation.subtitle, conversation.lastMessage]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function ConversationButton({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ChatConversation;
  selected: boolean;
  onSelect: (conversation: ChatConversation) => void;
}) {
  const unreadCount = Math.max(0, conversation.unreadCount);
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(conversation)}
      className="mb-2 w-full rounded-xl border p-3 text-left transition-colors last:mb-0"
      style={{
        borderColor: selected ? "var(--brand-border)" : "var(--border-default)",
        backgroundColor: selected ? "var(--brand-soft)" : "var(--bg-surface)",
      }}
      aria-label={`${conversation.title || "Conversation"}${unreadCount > 0 ? `, ${unreadCount} unread messages` : ""}`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <UserAvatar name={conversation.title} src={conversation.participants[0]?.avatarUrl} size="sm" />
        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }} title={conversation.title}>
          {conversation.title || "Untitled conversation"}
        </p>

        <div className="shrink-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {formatConversationTime(conversation.lastMessageAt)}
        </div>
      </div>

      <p className="truncate text-[12px]" style={{ color: "var(--text-secondary)" }}>
        {conversation.lastMessage || conversation.subtitle || "No messages yet"}
      </p>

      {unreadCount > 0 && (
        <span
          className="mt-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: "var(--color-primary-600)" }}
          aria-label={`${unreadCount} unread`}
        >
          {unreadLabel}
        </span>
      )}
    </button>
  );
}

export function ConversationList({
  searchQuery,
  teamConversations,
  hrConversations,
  selectedConversationKey,
  isLoading,
  canOpenHrSupport,
  isOpeningHrSupport,
  onSearchChange,
  onSelect,
  onOpenHrSupport,
}: ConversationListProps) {
  const searchInputId = "conversation-search";
  const query = searchQuery.trim().toLowerCase();
  const visibleTeamConversations = teamConversations.filter((conversation) => matchesQuery(conversation, query));
  const visibleHrConversations = hrConversations.filter((conversation) => matchesQuery(conversation, query));

  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="shrink-0 border-b p-4" style={{ borderColor: "var(--border-default)" }}>
        <div className="mb-4 min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Chat
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Team Chats and HR Support
          </p>
        </div>

        <label htmlFor={searchInputId} className="sr-only">
          Search chats
        </label>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
            aria-hidden="true"
          />

          <input
            id={searchInputId}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search chats"
            className="h-10 w-full rounded-xl border pl-9 pr-9 text-sm outline-none transition"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          />

          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-surface)",
              }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox" aria-label="Chat list">
        {isLoading && (
          <div className="space-y-2 p-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`conversation-skeleton-${index}`}
                className="h-20 animate-pulse rounded-xl border"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-muted)",
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 px-1">
                <Users size={14} style={{ color: "var(--text-tertiary)" }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                  Team Chats
                </p>
              </div>

              {visibleTeamConversations.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  No team chats available.
                </div>
              ) : (
                visibleTeamConversations.map((conversation) => (
                  <ConversationButton
                    key={buildConversationKey(conversation)}
                    conversation={conversation}
                    selected={selectedConversationKey === buildConversationKey(conversation)}
                    onSelect={onSelect}
                  />
                ))
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 px-1">
                <BriefcaseBusiness size={14} style={{ color: "var(--text-tertiary)" }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                  HR Support
                </p>
              </div>

              {visibleHrConversations.map((conversation) => (
                <ConversationButton
                  key={buildConversationKey(conversation)}
                  conversation={conversation}
                  selected={selectedConversationKey === buildConversationKey(conversation)}
                  onSelect={onSelect}
                />
              ))}

              {canOpenHrSupport && visibleHrConversations.length === 0 && (
                <button
                  type="button"
                  onClick={onOpenHrSupport}
                  disabled={isOpeningHrSupport}
                  className="w-full rounded-xl border p-3 text-left transition-colors disabled:opacity-60"
                  style={{
                    borderColor: "var(--brand-border)",
                    backgroundColor: "var(--brand-soft)",
                  }}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        Contact HR
                      </span>
                      <span className="mt-1 block text-xs" style={{ color: "var(--text-secondary)" }}>
                        Open your private HR support conversation.
                      </span>
                    </span>
                    {isOpeningHrSupport && <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-secondary)" }} />}
                  </span>
                </button>
              )}

              {!canOpenHrSupport && visibleHrConversations.length === 0 && (
                <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  No HR support conversations.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
