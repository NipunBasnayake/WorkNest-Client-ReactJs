import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getNumber, getString, toIsoDateTime } from "@/services/http/parsers";
import { readRealtimeDestinations, subscribeRealtime } from "@/services/realtime/stompService";
import { useAuthStore } from "@/store/authStore";
import type { ChatConversation, ChatMessage, ConversationType, SendMessagePayload } from "@/modules/chat/types";
import type { ApiResponse } from "@/types";

const conversationTypeMap = new Map<string, ConversationType>();
const CHAT_GLOBAL_REALTIME_DESTINATIONS = readRealtimeDestinations("VITE_CHAT_TOPICS", [
  "/user/queue/chats",
  "/user/queue/messages",
  "/topic/tenant/chats",
]);

function normalizeConversation(input: unknown, type: ConversationType): ChatConversation {
  const value = asRecord(input);
  const currentUserId = useAuthStore.getState().user?.id;
  const employee = asRecord(value.employee);
  const hr = asRecord(value.hr);

  const hrDisplayName =
    getId(employee.id) === currentUserId
      ? firstDefined(getString(hr.fullName), getString(hr.name), "HR")
      : firstDefined(getString(employee.fullName), getString(employee.name), "Employee");

  const name =
    firstDefined(
      getString(value.name),
      getString(value.conversationName),
      getString(value.teamName),
      getString(value.hrName),
      getString(asRecord(value.team).name),
      hrDisplayName
    ) ?? "Conversation";

  const participants = extractList(firstDefined(value.participants, value.members)).map((member) => {
    const item = asRecord(member);
    return firstDefined(
      getString(item.name),
      getString(item.fullName),
      getString(item.email)
    ) ?? "Member";
  });

  return {
    id: getId(firstDefined(value.id, value.conversationId, value.chatId)),
    name,
    type,
    participants,
    lastMessage: firstDefined(getString(value.lastMessage), getString(value.preview), getString(value.message)) ?? "",
    lastMessageAt: toIsoDateTime(firstDefined(value.lastMessageAt, value.updatedAt, value.createdAt)),
    unreadCount: firstDefined(
      getNumber(value.unreadCount),
      getNumber(value.unreadMessages)
    ) ?? 0,
  };
}

function normalizeMessage(input: unknown, conversationId: string): ChatMessage {
  const value = asRecord(input);
  return {
    id: getId(firstDefined(value.id, value.messageId)),
    conversationId: getId(firstDefined(value.conversationId, value.chatId)) || conversationId,
    senderId: getId(firstDefined(value.senderId, value.senderEmployeeId, asRecord(value.sender).id)),
    senderName: firstDefined(
      getString(value.senderName),
      getString(asRecord(value.sender).fullName),
      getString(asRecord(value.sender).name)
    ) ?? "User",
    content: firstDefined(getString(value.content), getString(value.message), getString(value.text)) ?? "",
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.sentAt, value.timestamp)),
  };
}

async function listHrConversations(): Promise<ChatConversation[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/chats/hr/conversations/my");
  return extractList(unwrapApiData<unknown>(data)).map((item) => normalizeConversation(item, "HR"));
}

async function listTeamConversations(): Promise<ChatConversation[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/chats/team/conversations/my");
  return extractList(unwrapApiData<unknown>(data)).map((item) => normalizeConversation(item, "TEAM"));
}

async function fetchMessagesForType(conversationId: string, type: ConversationType): Promise<ChatMessage[]> {
  const endpoint =
    type === "HR"
      ? `/api/tenant/chats/hr/conversations/${conversationId}/messages`
      : `/api/tenant/chats/team/conversations/${conversationId}/messages`;

  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(endpoint);
  return extractList(unwrapApiData<unknown>(data))
    .map((item) => normalizeMessage(item, conversationId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getConversations(): Promise<ChatConversation[]> {
  const [hrConversations, teamConversations] = await Promise.all([
    listHrConversations().catch(() => []),
    listTeamConversations().catch(() => []),
  ]);

  const conversations = [...teamConversations, ...hrConversations]
    .filter((item) => Boolean(item.id))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

  conversationTypeMap.clear();
  conversations.forEach((item) => {
    conversationTypeMap.set(item.id, item.type);
  });

  return conversations;
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const knownType = conversationTypeMap.get(conversationId);
  if (knownType) {
    return fetchMessagesForType(conversationId, knownType);
  }

  try {
    const hrMessages = await fetchMessagesForType(conversationId, "HR");
    conversationTypeMap.set(conversationId, "HR");
    return hrMessages;
  } catch {
    const teamMessages = await fetchMessagesForType(conversationId, "TEAM");
    conversationTypeMap.set(conversationId, "TEAM");
    return teamMessages;
  }
}

export async function sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
  const type = conversationTypeMap.get(payload.conversationId) ?? "TEAM";
  const senderEmployeeId = Number(payload.senderId);
  const endpoint =
    type === "HR"
      ? `/api/tenant/chats/hr/conversations/${payload.conversationId}/messages`
      : `/api/tenant/chats/team/conversations/${payload.conversationId}/messages`;

  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(endpoint, {
    senderEmployeeId: Number.isFinite(senderEmployeeId) ? senderEmployeeId : payload.senderId,
    message: payload.content.trim(),
  });

  return normalizeMessage(unwrapApiData<unknown>(data), payload.conversationId);
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  const type = conversationTypeMap.get(conversationId);
  if (type !== "HR") return;

  await apiClient.patch(`/api/tenant/chats/hr/conversations/${conversationId}/read`);
}

export function subscribeChatRealtime(
  conversation: { id: string; type: ConversationType } | null,
  listener: () => void
): () => void {
  const conversationDestinations = conversation
    ? [
      `/topic/tenant/chats/${conversation.type.toLowerCase()}/conversations/${conversation.id}`,
      `/topic/tenant/chats/${conversation.type.toLowerCase()}/${conversation.id}`,
      `/user/queue/chats/${conversation.id}`,
      `/user/queue/messages/${conversation.id}`,
    ]
    : [];

  const destinations = [...new Set([...CHAT_GLOBAL_REALTIME_DESTINATIONS, ...conversationDestinations])];
  return subscribeRealtime(destinations, () => {
    listener();
  });
}
