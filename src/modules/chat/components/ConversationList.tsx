import type { ChatConversation, ConversationType } from "@/modules/chat/types";

interface ConversationListProps {
  items: ChatConversation[];
  selectedId: string | null;
  filter: ConversationType | "ALL";
  onFilterChange: (next: ConversationType | "ALL") => void;
  onSelect: (conversationId: string) => void;
}

const FILTERS: Array<ConversationType | "ALL"> = ["ALL", "TEAM", "HR"];

function toLabel(value: ConversationType | "ALL") {
  if (value === "ALL") return "All";
  if (value === "HR") return "HR";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function ConversationList({
  items,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="h-full rounded-2xl border p-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFilterChange(item)}
            className="rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
            style={{
              background: filter === item ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
              color: filter === item ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            {toLabel(item)}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
        {items.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className="w-full rounded-xl border p-3 text-left cursor-pointer transition-colors"
            style={{
              backgroundColor: selectedId === conversation.id ? "rgba(147,50,234,0.08)" : "var(--bg-surface)",
              borderColor: selectedId === conversation.id ? "rgba(147,50,234,0.3)" : "var(--border-default)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{conversation.name}</p>
                <p className="mt-1 truncate text-xs" style={{ color: "var(--text-secondary)" }}>{conversation.lastMessage}</p>
              </div>
              {conversation.unreadCount > 0 && (
                <span
                  className="min-w-5 h-5 rounded-full px-1 text-[10px] font-semibold flex items-center justify-center"
                  style={{ backgroundColor: "#9332EA", color: "white" }}
                >
                  {conversation.unreadCount}
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {new Date(conversation.lastMessageAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
