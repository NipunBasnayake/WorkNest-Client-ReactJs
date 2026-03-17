import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ErrorBanner } from "@/components/common/AppUI";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ConversationList } from "@/app/chat/ConversationList";
import { MessageInput } from "@/app/chat/MessageInput";
import { MessageThread } from "@/app/chat/MessageThread";
import { useChat } from "@/app/chat/useChat";

export function ChatPage() {
  usePageMeta({ title: "Chat", breadcrumb: ["Workspace", "Chat"] });

  const { user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    currentEmployeeId,
    conversations,
    selectedConversation,
    selectedConversationId,
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Workspace Chat"
        description="Team channels and HR support with live updates."
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className={`${mobileThreadOpen ? "hidden lg:block" : "block"} h-[calc(100vh-230px)] min-h-[480px]`}>
          <ConversationList
            activeTab={activeTab}
            searchQuery={searchQuery}
            conversations={filteredConversations}
            selectedConversationId={selectedConversationId}
            isLoading={isLoadingConversations}
            currentEmployeeId={currentEmployeeId}
            currentUserRole={typeof user?.role === "string" ? user.role : undefined}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSearchQuery("");
              setMobileThreadOpen(false);
            }}
            onSearchChange={setSearchQuery}
            onSelect={(conversationId) => {
              selectConversation(conversationId);
              setMobileThreadOpen(true);
            }}
            onCreateTeamConversation={async (teamId) => {
              await startTeamConversation(teamId);
              setMobileThreadOpen(true);
            }}
            onCreateHrConversation={async (employeeId, hrId) => {
              await startHrConversation(employeeId, hrId);
              setMobileThreadOpen(true);
            }}
          />
        </div>

        <div className={`${mobileThreadOpen ? "block" : "hidden lg:block"} h-[calc(100vh-230px)] min-h-[480px]`}>
          <div className="mb-2 lg:hidden">
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
              currentUserId={currentEmployeeId ?? ""}
              isLoading={isLoadingMessages}
            />

            <MessageInput
              disabled={!selectedConversation || !currentEmployeeId}
              isSending={isSending}
              onSend={sendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
