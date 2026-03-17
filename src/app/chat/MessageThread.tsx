import { useEffect, useMemo, useRef } from "react";
import type { ChatConversation, ChatMessage } from "@/modules/chat/types";

interface MessageThreadProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
}

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function MessageThread({ conversation, messages, currentUserId, isLoading }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const renderedMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.id, renderedMessages]);

  if (!conversation) {
    return (
      <section
        className="h-full rounded-2xl border flex items-center justify-center p-6 text-center"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Select a conversation
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            Choose a chat to start messaging.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="h-full rounded-2xl border flex flex-col"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <header className="border-b px-4 py-3" style={{ borderColor: "var(--border-default)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {conversation.title}
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {conversation.subtitle}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`message-skeleton-${index}`}
                className="h-14 animate-pulse rounded-2xl"
                style={{ backgroundColor: "var(--bg-muted)" }}
              />
            ))}
          </div>
        )}

        {!isLoading && renderedMessages.length === 0 && (
          <div
            className="rounded-xl border border-dashed p-4 text-center text-sm"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            No messages yet. Send the first message.
          </div>
        )}

        {!isLoading && renderedMessages.length > 0 && (
          <div className="space-y-3">
            {renderedMessages.map((message) => {
              const mine = message.senderEmployeeId === currentUserId;

              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3 py-2"
                    style={{
                      background: mine
                        ? "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)"
                        : "var(--bg-muted)",
                      color: mine ? "white" : "var(--text-primary)",
                    }}
                  >
                    {!mine && (
                      <p className="mb-1 text-[11px] font-semibold opacity-80">{message.senderName}</p>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                    <p
                      className={`mt-1 text-[11px] ${mine ? "text-white/80" : ""}`}
                      style={!mine ? { color: "var(--text-tertiary)" } : undefined}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </section>
  );
}

