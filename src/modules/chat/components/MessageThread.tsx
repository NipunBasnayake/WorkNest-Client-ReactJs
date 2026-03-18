import type { ChatConversation, ChatMessage } from "@/modules/chat/types";

interface MessageThreadProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: string;
}

export function MessageThread({ conversation, messages, currentUserId }: MessageThreadProps) {
  if (!conversation) {
    return (
      <div className="h-full rounded-2xl border flex items-center justify-center p-6 text-center" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Select a conversation
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            Choose a chat from the left panel to view messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border flex flex-col" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border-default)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{conversation.name}</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{conversation.type} conversation</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-center text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2"
                style={{
                  background: isMine ? "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" : "var(--bg-muted)",
                  color: isMine ? "white" : "var(--text-primary)",
                }}
              >
                {!isMine && (
                  <p className="mb-1 text-[11px] font-semibold opacity-80">{message.senderName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`mt-1 text-[11px] ${isMine ? "text-white/80" : ""}`} style={!isMine ? { color: "var(--text-tertiary)" } : undefined}>
                  {new Date(message.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
