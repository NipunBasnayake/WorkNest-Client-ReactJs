import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft } from "lucide-react";
import type { ChatConversation, ChatMessage } from "@/modules/chat/types";
import { buildConversationKey, formatMessageDay, formatMessageTime } from "@/app/chat/chatUtils";

interface MessageThreadProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
  showMobileBackButton: boolean;
  onMobileBack: () => void;
}

type ThreadItem =
  | { kind: "divider"; id: string; label: string }
  | { kind: "message"; id: string; mine: boolean; showSender: boolean; data: ChatMessage };

export function MessageThread({
  conversation,
  messages,
  currentUserId,
  isLoading,
  showMobileBackButton,
  onMobileBack,
}: MessageThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const conversationKey = conversation ? buildConversationKey(conversation) : null;

  const threadItems = useMemo<ThreadItem[]>(() => {
    const items: ThreadItem[] = [];

    messages.forEach((message, index) => {
      const previous = messages[index - 1];
      const dayLabel = formatMessageDay(message.createdAt);
      const previousDayLabel = previous ? formatMessageDay(previous.createdAt) : "";
      const mine = message.senderEmployeeId === currentUserId;
      const showSender = !mine && (!previous || previous.senderEmployeeId !== message.senderEmployeeId || dayLabel !== previousDayLabel);

      if (dayLabel && dayLabel !== previousDayLabel) {
        items.push({
          kind: "divider",
          id: `divider:${dayLabel}:${message.id}`,
          label: dayLabel,
        });
      }

      items.push({
        kind: "message",
        id: message.id,
        mine,
        showSender,
        data: message,
      });
    });

    return items;
  }, [currentUserId, messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const updateBottomState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsAtBottom(remaining < 48);
  }, []);

  useEffect(() => {
    previousMessageCountRef.current = 0;

    if (!conversationKey) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
      updateBottomState();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [conversationKey, scrollToBottom, updateBottomState]);

  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const nextCount = messages.length;

    if (nextCount === 0) {
      previousMessageCountRef.current = 0;
      return;
    }

    const latestMessage = messages[nextCount - 1];
    const latestIsMine = Boolean(latestMessage && latestMessage.senderEmployeeId === currentUserId);
    const hasNewMessage = nextCount > previousCount;

    if (hasNewMessage && (isAtBottom || latestIsMine)) {
      const behavior: ScrollBehavior = previousCount > 0 && latestIsMine ? "smooth" : "auto";
      scrollToBottom(behavior);
    }

    previousMessageCountRef.current = nextCount;
  }, [currentUserId, isAtBottom, messages, scrollToBottom]);

  if (!conversation) {
    return (
      <section
        className="flex h-full min-h-0 items-center justify-center rounded-2xl border p-6 text-center"
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
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <header
        className="flex shrink-0 items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        {showMobileBackButton && (
          <button
            type="button"
            onClick={onMobileBack}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={14} />
          </button>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {conversation.title}
          </p>
          <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
            {conversation.subtitle}
          </p>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        onScroll={updateBottomState}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
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

        {!isLoading && messages.length === 0 && (
          <div
            className="rounded-xl border border-dashed p-6 text-center text-sm"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            No messages yet. Send the first message.
          </div>
        )}

        {!isLoading && messages.length > 0 && (
          <ol className="space-y-2" role="log" aria-live="polite" aria-relevant="additions text">
            {threadItems.map((item) => {
              if (item.kind === "divider") {
                return (
                  <li key={item.id} className="flex justify-center py-1">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[11px]"
                      style={{
                        borderColor: "var(--border-default)",
                        backgroundColor: "var(--bg-muted)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              }

              const { data, mine, showSender } = item;
              const messageText = data.message || data.content || "";

              return (
                <li key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[min(84%,44rem)]">
                    {showSender && (
                      <p className="mb-1 px-1 text-[11px] font-semibold" style={{ color: "var(--text-tertiary)" }}>
                        {data.senderName || "Unknown"}
                      </p>
                    )}

                    <div
                      className="rounded-2xl px-3 py-2"
                      style={{
                        background: mine ? "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)" : "var(--bg-muted)",
                        color: mine ? "white" : "var(--text-primary)",
                      }}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">{messageText || "-"}</p>
                    </div>

                    <p
                      className={`mt-1 px-1 text-[11px] ${mine ? "text-right" : "text-left"}`}
                      style={{ color: mine ? "var(--text-tertiary)" : "var(--text-tertiary)" }}
                    >
                      {formatMessageTime(data.createdAt)}
                      {data.editedAt ? " - edited" : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {!isAtBottom && messages.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 right-4">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-secondary)",
            }}
          >
            <ArrowDown size={12} />
            Latest
          </button>
        </div>
      )}
    </section>
  );
}
