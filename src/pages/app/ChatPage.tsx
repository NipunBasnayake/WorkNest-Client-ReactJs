import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Paperclip, SendHorizontal, Search } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { ConversationList } from "@/modules/chat/components/ConversationList";
import { MessageThread } from "@/modules/chat/components/MessageThread";
import {
  getConversationMessages,
  getConversations,
  markConversationAsRead,
  subscribeChatRealtime,
  sendMessage,
} from "@/modules/chat/services/chatService";
import { ErrorBanner } from "@/components/common/AppUI";
import { PageHeader } from "@/components/common/PageHeader";
import type { ChatConversation, ChatMessage, ConversationType } from "@/modules/chat/types";

export function ChatPage() {
  usePageMeta({ title: "Chat", breadcrumb: ["Workspace", "Chat"] });
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConversationType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConversations();
      setConversations(data);
      setSelectedConversationId((previous) => previous ?? data[0]?.id ?? null);
    } catch {
      setError("Unable to load chat conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let active = true;
    getConversationMessages(selectedConversationId)
      .then((data) => {
        if (active) setMessages(data);
      })
      .catch(() => {
        if (active) setError("Unable to load messages.");
      });

    markConversationAsRead(selectedConversationId)
      .then(() => getConversations())
      .then((data) => {
        if (active) setConversations(data);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );
  const selectedConversationType = selectedConversation?.type ?? null;

  const refreshThread = useCallback(async () => {
    if (!selectedConversationId) return;

    setRefreshing(true);
    try {
      const [nextMessages, nextConversations] = await Promise.all([
        getConversationMessages(selectedConversationId),
        getConversations(),
      ]);
      setMessages(nextMessages);
      setConversations(nextConversations);
    } catch {
      // Ignore background refresh errors; page-level error is handled on primary loads.
    } finally {
      setRefreshing(false);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    const unsubscribe = subscribeChatRealtime(
      selectedConversationId && selectedConversationType
        ? { id: selectedConversationId, type: selectedConversationType }
        : null,
      () => {
        void refreshThread();
      }
    );

    return unsubscribe;
  }, [refreshThread, selectedConversationId, selectedConversationType]);

  useEffect(() => {
    if (!selectedConversationId) return;
    const interval = window.setInterval(() => {
      void refreshThread();
    }, 15_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshThread, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesFilter = filter === "ALL" || conversation.type === filter;
      const matchesQuery =
        !query ||
        [conversation.name, conversation.lastMessage]
          .some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesQuery;
    });
  }, [conversations, filter, search]);

  async function handleSend() {
    if (!user || !selectedConversationId || !composer.trim()) return;
    setSending(true);
    try {
      const created = await sendMessage({
        conversationId: selectedConversationId,
        senderId: user.id,
        senderName: user.name,
        content: composer.trim(),
      });
      setMessages((prev) => [...prev, created]);
      setComposer("");
      await refreshThread();
    } catch {
      setError("Unable to send message right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Workspace Chat"
        description={refreshing ? "Syncing new messages..." : "Team channels and HR support in one place."}
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search conversations..."
          className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
        />
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchConversations} />}

      {loading && (
        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
          <div className="h-72 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <div className={`${mobileThreadOpen ? "hidden lg:block" : "block"}`}>
            <ConversationList
              items={filteredConversations}
              selectedId={selectedConversationId}
              filter={filter}
              onFilterChange={setFilter}
              onSelect={(id) => {
                setSelectedConversationId(id);
                setMobileThreadOpen(true);
              }}
            />
          </div>

          <div className={`${mobileThreadOpen ? "block" : "hidden lg:block"} h-[calc(100vh-230px)] min-h-[420px]`}>
            <div className="mb-2 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setMobileThreadOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                style={{ color: "var(--color-primary-600)" }}
              >
                <ArrowLeft size={14} />
                Back to conversations
              </button>
            </div>

            <div className="grid h-full grid-rows-[1fr_auto] gap-3">
              <MessageThread
                conversation={selectedConversation}
                messages={messages}
                currentUserId={user?.id ?? ""}
              />

              <div className="rounded-2xl border p-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-xl border flex items-center justify-center cursor-pointer"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                    title="Chat attachments are not enabled yet."
                  >
                    <Paperclip size={16} />
                  </button>
                  <textarea
                    rows={2}
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    placeholder={selectedConversation ? "Type your message..." : "Select a conversation to start messaging"}
                    disabled={!selectedConversation}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-60"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !selectedConversation || !composer.trim()}
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white cursor-pointer disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
                  >
                    <SendHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
