import { sortConversations, sortMessages } from "@/app/chat/chatUtils";
import type { ChatConversation, ChatMessage } from "@/modules/chat/types";

export function clearUnread(
  conversations: ChatConversation[],
  target: Pick<ChatConversation, "id" | "type">
): ChatConversation[] {
  return conversations.map((conversation) => {
    if (conversation.id !== target.id || conversation.type !== target.type) return conversation;
    return {
      ...conversation,
      unreadCount: 0,
    };
  });
}

export function upsertMessage(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const index = messages.findIndex((message) => message.id === incoming.id);
  if (index >= 0) {
    const next = [...messages];
    next[index] = incoming;
    return sortMessages(next);
  }

  return sortMessages([...messages, incoming]);
}

export function trimSeenRealtimeMap(seen: Map<string, number>): void {
  if (seen.size <= 500) return;

  const sortedEntries = [...seen.entries()].sort((left, right) => left[1] - right[1]);
  const removeCount = seen.size - 350;

  for (let index = 0; index < removeCount; index += 1) {
    const key = sortedEntries[index]?.[0];
    if (key) {
      seen.delete(key);
    }
  }
}

export function createRealtimeMessageKey(message: ChatMessage): string {
  return `${message.chatType}:${message.conversationId}:${message.id}`;
}

export function placeConversationOnTop(
  conversations: ChatConversation[],
  incoming: ChatConversation
): ChatConversation[] {
  const withoutTarget = conversations.filter(
    (conversation) => !(conversation.id === incoming.id && conversation.type === incoming.type)
  );

  return [incoming, ...withoutTarget];
}

export function updateConversationPreview(
  conversations: ChatConversation[],
  message: ChatMessage,
  incrementUnread: boolean
): { next: ChatConversation[]; found: boolean } {
  let found = false;

  const next = conversations.map((conversation) => {
    if (conversation.id !== message.conversationId || conversation.type !== message.chatType) {
      return conversation;
    }

    found = true;
    return {
      ...conversation,
      lastMessage: message.message,
      lastMessageAt: message.createdAt,
      unreadCount: incrementUnread ? conversation.unreadCount + 1 : 0,
    };
  });

  return {
    next: sortConversations(next),
    found,
  };
}

export function areMessagesEquivalent(left: ChatMessage[], right: ChatMessage[]): boolean {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];

    if (
      a.id !== b.id
      || a.message !== b.message
      || a.editedAt !== b.editedAt
      || a.createdAt !== b.createdAt
      || a.senderEmployeeId !== b.senderEmployeeId
    ) {
      return false;
    }
  }

  return true;
}
