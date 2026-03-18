import { BriefcaseBusiness, MessageSquarePlus, Search, Users, X } from "lucide-react";
import type { ChatConversation, ChatType } from "@/modules/chat/types";
import { buildConversationKey, formatConversationTime } from "@/app/chat/chatUtils";

interface ConversationListProps {
  activeTab: ChatType;
  searchQuery: string;
  conversations: ChatConversation[];
  selectedConversationKey: string | null;
  isLoading: boolean;
  onTabChange: (tab: ChatType) => void;
  onSearchChange: (value: string) => void;
  onSelect: (conversation: ChatConversation) => void;
  onRequestNewConversation: () => void;
}

export function ConversationList({
  activeTab,
  searchQuery,
  conversations,
  selectedConversationKey,
  isLoading,
  onTabChange,
  onSearchChange,
  onSelect,
  onRequestNewConversation,
}: ConversationListProps) {
  const searchInputId = "conversation-search";
  const teamTabActive = activeTab === "TEAM";

  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="shrink-0 border-b p-4" style={{ borderColor: "var(--border-default)" }}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Conversations
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {conversations.length} visible
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestNewConversation}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
            style={{
              background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
            }}
            aria-label="Start a new conversation"
          >
            <MessageSquarePlus size={14} />
            New Chat
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Conversation type">
          <button
            type="button"
            role="tab"
            aria-selected={teamTabActive}
            onClick={() => onTabChange("TEAM")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: teamTabActive ? "rgba(147,50,234,0.32)" : "var(--border-default)",
              backgroundColor: teamTabActive ? "rgba(147,50,234,0.12)" : "var(--bg-muted)",
              color: teamTabActive ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            <Users size={14} />
            Team
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!teamTabActive}
            onClick={() => onTabChange("HR")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: !teamTabActive ? "rgba(147,50,234,0.32)" : "var(--border-default)",
              backgroundColor: !teamTabActive ? "rgba(147,50,234,0.12)" : "var(--bg-muted)",
              color: !teamTabActive ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            <BriefcaseBusiness size={14} />
            HR
          </button>
        </div>

        <label htmlFor={searchInputId} className="sr-only">
          Search conversations
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
            placeholder={teamTabActive ? "Search team chats" : "Search HR chats"}
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

      <div className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox" aria-label="Conversation list">
        {isLoading && (
          <div className="space-y-2 p-1">
            {Array.from({ length: 7 }).map((_, index) => (
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

        {!isLoading && conversations.length === 0 && (
          <div
            className="mx-1 mt-1 rounded-xl border border-dashed px-4 py-10 text-center"
            style={{ borderColor: "var(--border-default)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              No conversations found
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              Try another keyword or start a new chat.
            </p>
          </div>
        )}

        {!isLoading &&
          conversations.map((conversation) => {
            const conversationKey = buildConversationKey(conversation);
            const selected = selectedConversationKey === conversationKey;
            const unreadCount = Math.max(0, conversation.unreadCount);
            const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

            return (
              <button
                key={conversationKey}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(conversation)}
                className="mb-2 w-full rounded-xl border p-3 text-left transition-colors last:mb-0"
                style={{
                  borderColor: selected ? "rgba(147,50,234,0.36)" : "var(--border-default)",
                  backgroundColor: selected ? "rgba(147,50,234,0.1)" : "var(--bg-surface)",
                }}
                aria-label={`${conversation.title || "Conversation"}${unreadCount > 0 ? `, ${unreadCount} unread messages` : ""}`}
              >
                <div className="mb-1.5 flex items-start justify-between gap-3">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                    title={conversation.title}
                  >
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
                    style={{
                      backgroundColor: "var(--color-primary-600)",
                    }}
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadLabel}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </aside>
  );
}
