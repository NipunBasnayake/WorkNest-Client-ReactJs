import { useMemo, useState } from "react";
import { MessageSquarePlus, RefreshCcw } from "lucide-react";
import { ErrorBanner } from "@/components/common/AppUI";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ConversationList } from "@/app/chat/ConversationList";
import { MessageInput } from "@/app/chat/MessageInput";
import { MessageThread } from "@/app/chat/MessageThread";
import { NewConversationModal } from "@/app/chat/NewConversationModal";
import { useChat } from "@/app/chat/useChat";
import { buildConversationKey } from "@/app/chat/chatUtils";

export function ChatPage() {
  usePageMeta({ title: "Chat", breadcrumb: ["Workspace", "Chat"] });

  const { user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    currentEmployeeId,
    conversations,
    selectedConversation,
    selectedConversationKey,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
    refreshConversations,
    selectConversation,
    sendMessage,
    startTeamConversation,
    startHrConversation,
    clearError,
  } = useChat(user?.id);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState<boolean>(false);
  const [newConversationOpen, setNewConversationOpen] = useState<boolean>(false);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      return [conversation.title, conversation.subtitle, conversation.lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [conversations, searchQuery]);

  const effectiveSelectedKey = selectedConversation ? buildConversationKey(selectedConversation) : selectedConversationKey;
  const showMobileThread = mobileThreadOpen && Boolean(selectedConversation);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <PageHeader
        title="Workspace Chat"
        description="Team channels and HR support with live updates."
        actions={(
          <>
            <button
              type="button"
              onClick={() => {
                clearError();
                void refreshConversations();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-surface)",
              }}
              disabled={isLoadingConversations}
            >
              <RefreshCcw size={14} className={isLoadingConversations ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setNewConversationOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
              }}
            >
              <MessageSquarePlus size={14} />
              New Chat
            </button>
          </>
        )}
      />

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => {
            clearError();
            void refreshConversations();
          }}
        />
      )}

      <section className="h-[calc(100dvh-13rem)] min-h-[30rem]">
        <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className={`${showMobileThread ? "hidden" : "block"} min-h-0 lg:block`}>
            <ConversationList
              activeTab={activeTab}
              searchQuery={searchQuery}
              conversations={filteredConversations}
              selectedConversationKey={effectiveSelectedKey}
              isLoading={isLoadingConversations}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSearchQuery("");
                setMobileThreadOpen(false);
              }}
              onSearchChange={setSearchQuery}
              onSelect={(conversation) => {
                selectConversation(conversation.id);
                setMobileThreadOpen(true);
              }}
              onRequestNewConversation={() => setNewConversationOpen(true)}
            />
          </div>

          <div className={`${showMobileThread ? "block" : "hidden"} min-h-0 lg:block`}>
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
              <MessageThread
                conversation={selectedConversation}
                messages={messages}
                currentUserId={currentEmployeeId ?? ""}
                isLoading={isLoadingMessages}
                showMobileBackButton={showMobileThread}
                onMobileBack={() => setMobileThreadOpen(false)}
              />

              <MessageInput
                key={effectiveSelectedKey ?? "no-conversation"}
                disabled={!selectedConversation || !currentEmployeeId}
                isSending={isSending}
                onSend={sendMessage}
              />
            </div>
          </div>
        </div>
      </section>

      <NewConversationModal
        open={newConversationOpen}
        defaultType={activeTab}
        currentEmployeeId={currentEmployeeId}
        currentUserRole={typeof user?.role === "string" ? user.role : undefined}
        onClose={() => setNewConversationOpen(false)}
        onCreateTeamConversation={async (teamId) => {
          await startTeamConversation(teamId);
          setNewConversationOpen(false);
          setMobileThreadOpen(true);
        }}
        onCreateHrConversation={async (employeeId, hrId) => {
          await startHrConversation(employeeId, hrId);
          setNewConversationOpen(false);
          setMobileThreadOpen(true);
        }}
      />
    </div>
  );
}
