import { useState } from "react";
import { ErrorBanner } from "@/components/common/AppUI";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ConversationList } from "@/app/chat/ConversationList";
import { MessageInput } from "@/app/chat/MessageInput";
import { MessageThread } from "@/app/chat/MessageThread";
import { useChat } from "@/app/chat/useChat";
import { buildConversationKey } from "@/app/chat/chatUtils";

export function ChatPage() {
  usePageMeta({ title: "Chat", breadcrumb: ["Workspace", "Chat"] });

  const { user } = useAuth();
  const {
    currentEmployeeId,
    teamConversations,
    hrConversations,
    canOpenHrSupport,
    canSendSelectedConversation,
    selectedConversation,
    selectedConversationKey,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
    refreshConversations,
    selectConversation,
    openHrSupportConversation,
    sendMessage,
    clearError,
  } = useChat(user?.id, typeof user?.role === "string" ? user.role : undefined);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState<boolean>(false);
  const [isOpeningHrSupport, setIsOpeningHrSupport] = useState<boolean>(false);

  const effectiveSelectedKey = selectedConversation ? buildConversationKey(selectedConversation) : selectedConversationKey;
  const showMobileThread = mobileThreadOpen && Boolean(selectedConversation);

  async function handleOpenHrSupport() {
    setIsOpeningHrSupport(true);
    clearError();
    try {
      await openHrSupportConversation();
      setMobileThreadOpen(true);
    } finally {
      setIsOpeningHrSupport(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <PageHeader
        title="Workspace Chat"
        description="Team chats and HR support in one focused workspace."
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
              searchQuery={searchQuery}
              teamConversations={teamConversations}
              hrConversations={hrConversations}
              selectedConversationKey={effectiveSelectedKey}
              isLoading={isLoadingConversations}
              canOpenHrSupport={canOpenHrSupport}
              isOpeningHrSupport={isOpeningHrSupport}
              onSearchChange={setSearchQuery}
              onSelect={(conversation) => {
                selectConversation(conversation);
                setMobileThreadOpen(true);
              }}
              onOpenHrSupport={() => {
                void handleOpenHrSupport();
              }}
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
                disabled={!selectedConversation || !currentEmployeeId || !canSendSelectedConversation}
                disabledReason={
                  selectedConversation?.type === "HR" && !canSendSelectedConversation
                    ? "Admins can observe HR support conversations but cannot reply."
                    : undefined
                }
                isSending={isSending}
                onSend={sendMessage}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
