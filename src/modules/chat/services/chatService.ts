import {
  getHrConversationMessages,
  getHrConversationTargets,
  getMyHrConversations,
  getMyTeamConversations,
  getReadReceipts,
  getTeamConversationByTeam,
  getTeamConversationMessages,
  patchHrConversationRead,
  postHrConversation,
  postHrConversationMessage,
  postReadReceipt,
  postTeamConversation,
  postTeamConversationMessage,
  type ChatId,
  type ChatTypeDto,
} from "@/modules/chat/services/chatApi";
import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChatReadReceipt,
  ChatType,
  ConversationType,
  SendChatMessageInput,
  SendMessagePayload,
} from "@/modules/chat/types";
import { asRecord, extractList, firstDefined, getId, getNumber, getString, isRecord, toIsoDateTime } from "@/services/http/parsers";
import { readRealtimeDestinations, subscribeRealtime, type RealtimeListener } from "@/services/realtime/stompService";
import { useAuthStore } from "@/store/authStore";

const conversationTypeById = new Map<string, ChatType>();

const CHAT_GLOBAL_REALTIME_DESTINATIONS = readRealtimeDestinations("VITE_CHAT_TOPICS", [
  "/user/queue/chats",
  "/user/queue/messages",
  "/topic/tenant/chats",
  "/topic/tenant/chats/hr",
  "/topic/tenant/chats/team",
]);

function parseChatType(value: unknown): ChatType | undefined {
  const parsed = getString(value)?.toUpperCase();
  if (parsed === "TEAM" || parsed === "HR") return parsed;
  return undefined;
}

function coerceChatType(value: ChatType | ChatTypeDto): ChatType {
  return value === "HR" ? "HR" : "TEAM";
}

function rememberConversationType(conversation: Pick<ChatConversation, "id" | "type">): void {
  if (!conversation.id) return;
  conversationTypeById.set(conversation.id, conversation.type);
}

function sortConversations(conversations: ChatConversation[]): ChatConversation[] {
  return [...conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function sortParticipants(participants: ChatParticipant[]): ChatParticipant[] {
  return [...participants].sort((a, b) => a.name.localeCompare(b.name));
}

function buildParticipant(input: unknown): ChatParticipant | null {
  const value = asRecord(input);
  const id = getId(firstDefined(value.id, value.employeeId, value.userId));
  const name = firstDefined(getString(value.fullName), getString(value.name), getString(value.email));
  if (!id && !name) return null;

  return {
    id: id || name || "",
    name: name ?? "Member",
    email: getString(value.email),
    role: getString(value.role),
  };
}

function uniqueParticipants(participants: ChatParticipant[]): ChatParticipant[] {
  const seen = new Set<string>();
  const normalized: ChatParticipant[] = [];

  participants.forEach((participant) => {
    const key = `${participant.id}|${participant.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(participant);
  });

  return normalized;
}

function normalizeHrConversation(input: unknown): ChatConversation {
  const value = asRecord(input);
  const employee = asRecord(value.employee);
  const hr = asRecord(value.hr);

  const currentUserId = useAuthStore.getState().user?.id;
  const id = getId(firstDefined(value.id, value.conversationId, value.chatId));
  const employeeId = getId(firstDefined(value.employeeId, employee.id));
  const hrId = getId(firstDefined(value.hrId, hr.id));

  const employeeName = firstDefined(getString(employee.fullName), getString(employee.name), getString(value.employeeName), "Employee") ?? "Employee";
  const hrName = firstDefined(getString(hr.fullName), getString(hr.name), getString(value.hrName), "HR") ?? "HR";

  const counterpartName = currentUserId && currentUserId === employeeId ? hrName : employeeName;
  const title =
    firstDefined(getString(value.name), getString(value.conversationName), counterpartName, "HR Conversation") ?? "HR Conversation";

  const participants = uniqueParticipants(
    [employee, hr, ...extractList(value.participants), ...extractList(value.members)]
      .map((item) => buildParticipant(item))
      .filter((item): item is ChatParticipant => item !== null)
  );

  const unreadCount = firstDefined(getNumber(value.unreadCount), getNumber(value.unreadMessages)) ?? 0;
  const lastMessage = firstDefined(getString(value.lastMessage), getString(value.preview), getString(value.message)) ?? "";
  const lastMessageAt = toIsoDateTime(firstDefined(value.lastMessageAt, value.updatedAt, value.createdAt));
  const subtitle = `HR chat${participants.length > 0 ? ` - ${participants.length} participant${participants.length > 1 ? "s" : ""}` : ""}`;

  const conversation: ChatConversation = {
    id,
    type: "HR",
    title,
    subtitle,
    participants,
    lastMessage,
    lastMessageAt,
    unreadCount,
    employeeId: employeeId || undefined,
    hrId: hrId || undefined,
    name: title,
  };

  rememberConversationType(conversation);
  return conversation;
}

function normalizeTeamConversation(input: unknown): ChatConversation {
  const value = asRecord(input);
  const team = asRecord(value.team);

  const id = getId(firstDefined(value.id, value.conversationId, value.chatId));
  const teamId = getId(firstDefined(value.teamId, team.id));
  const teamName = firstDefined(getString(value.teamName), getString(team.name), getString(value.name), getString(value.conversationName));

  const participants = uniqueParticipants(
    [...extractList(value.participants), ...extractList(value.members)]
      .map((item) => buildParticipant(item))
      .filter((item): item is ChatParticipant => item !== null)
  );

  const title = teamName ?? (teamId ? `Team #${teamId}` : "Team Chat");
  const subtitle = participants.length > 0 ? `${participants.length} team member${participants.length > 1 ? "s" : ""}` : "Team chat";

  const unreadCount = firstDefined(getNumber(value.unreadCount), getNumber(value.unreadMessages)) ?? 0;
  const lastMessage = firstDefined(getString(value.lastMessage), getString(value.preview), getString(value.message)) ?? "";
  const lastMessageAt = toIsoDateTime(firstDefined(value.lastMessageAt, value.updatedAt, value.createdAt));

  const conversation: ChatConversation = {
    id,
    type: "TEAM",
    title,
    subtitle,
    participants,
    lastMessage,
    lastMessageAt,
    unreadCount,
    teamId: teamId || undefined,
    teamName: teamName || undefined,
    name: title,
  };

  rememberConversationType(conversation);
  return conversation;
}

function normalizeMessage(
  input: unknown,
  fallback: {
    conversationId: string;
    type: ChatType;
  }
): ChatMessage {
  const value = asRecord(input);
  const sender = asRecord(value.sender);

  const conversationId =
    getId(firstDefined(value.conversationId, value.chatId, value.hrConversationId, value.teamChatId)) || fallback.conversationId;
  const senderEmployeeId = getId(firstDefined(value.senderEmployeeId, value.senderId, sender.id));
  const senderName =
    firstDefined(getString(value.senderName), getString(sender.fullName), getString(sender.name), getString(sender.email), "User") ?? "User";
  const text = firstDefined(getString(value.message), getString(value.content), getString(value.text)) ?? "";

  const createdAt = toIsoDateTime(firstDefined(value.createdAt, value.sentAt, value.timestamp));
  const id =
    getId(firstDefined(value.id, value.messageId)) || `${conversationId}:${senderEmployeeId || "unknown"}:${createdAt}:${text.length}`;

  const chatType = parseChatType(value.chatType) ?? fallback.type;
  const editedAt = firstDefined(getString(value.updatedAt), getString(value.editedAt));

  return {
    id,
    chatType,
    conversationId,
    senderEmployeeId,
    senderName,
    message: text,
    createdAt,
    editedAt,
    senderId: senderEmployeeId,
    content: text,
  };
}

function normalizeReadReceipt(
  input: unknown,
  fallback: {
    chatType: ChatType;
    messageId: string;
  }
): ChatReadReceipt {
  const value = asRecord(input);
  const reader = asRecord(value.reader);

  const id = getId(firstDefined(value.id, value.readReceiptId)) || `${fallback.chatType}:${fallback.messageId}`;
  const chatType = parseChatType(value.chatType) ?? fallback.chatType;
  const messageId = getId(firstDefined(value.messageId, value.chatMessageId)) || fallback.messageId;
  const readerEmployeeId = getId(firstDefined(value.readerEmployeeId, value.readerId, reader.id));
  const readerName =
    firstDefined(getString(value.readerName), getString(reader.fullName), getString(reader.name), getString(reader.email), "User") ?? "User";
  const readAt = toIsoDateTime(firstDefined(value.readAt, value.createdAt));

  return {
    id,
    chatType,
    messageId,
    readerEmployeeId,
    readerName,
    readAt,
  };
}

export async function createOrGetHrConversation(employeeId: ChatId, hrId: ChatId): Promise<ChatConversation> {
  const dto = await postHrConversation({ employeeId, hrId });
  return normalizeHrConversation(dto);
}

export async function createHrConversation(employeeId: ChatId, hrId: ChatId): Promise<ChatConversation> {
  return createOrGetHrConversation(employeeId, hrId);
}

export async function listMyHrConversations(): Promise<ChatConversation[]> {
  const dto = await getMyHrConversations();
  const conversations = extractList(dto)
    .map((item) => normalizeHrConversation(item))
    .filter((item) => Boolean(item.id));

  return sortConversations(conversations);
}

export async function listHrConversationTargets(): Promise<{
  hrTargets: ChatParticipant[];
  employeeTargets: ChatParticipant[];
}> {
  const dto = await getHrConversationTargets();
  const value = asRecord(dto);

  const hrTargets = uniqueParticipants(
    extractList(value.hrTargets)
      .map((item) => buildParticipant(item))
      .filter((item): item is ChatParticipant => item !== null)
  );

  const employeeTargets = uniqueParticipants(
    extractList(value.employeeTargets)
      .map((item) => buildParticipant(item))
      .filter((item): item is ChatParticipant => item !== null)
  );

  return {
    hrTargets: sortParticipants(hrTargets),
    employeeTargets: sortParticipants(employeeTargets),
  };
}

export async function listHrConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const dto = await getHrConversationMessages(conversationId);
  return sortMessages(
    extractList(dto)
      .map((item) => normalizeMessage(item, { conversationId, type: "HR" }))
      .filter((item) => Boolean(item.id && item.conversationId))
  );
}

export async function sendHrMessage(conversationId: string, senderEmployeeId: ChatId, message: string): Promise<ChatMessage> {
  const dto = await postHrConversationMessage(conversationId, {
    senderEmployeeId,
    message,
  });

  return normalizeMessage(dto, { conversationId, type: "HR" });
}

export async function markHrConversationMessagesAsRead(conversationId: string): Promise<void> {
  await patchHrConversationRead(conversationId);
}

export async function createOrGetTeamConversation(teamId: ChatId): Promise<ChatConversation> {
  const dto = await postTeamConversation({ teamId });
  return normalizeTeamConversation(dto);
}

export async function createTeamConversation(teamId: ChatId): Promise<ChatConversation> {
  return createOrGetTeamConversation(teamId);
}

export async function getOrCreateTeamConversationByTeam(teamId: ChatId): Promise<ChatConversation> {
  const dto = await getTeamConversationByTeam(teamId);
  return normalizeTeamConversation(dto);
}

export async function listMyTeamConversations(): Promise<ChatConversation[]> {
  const dto = await getMyTeamConversations();
  const conversations = extractList(dto)
    .map((item) => normalizeTeamConversation(item))
    .filter((item) => Boolean(item.id));

  return sortConversations(conversations);
}

export async function listTeamConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const dto = await getTeamConversationMessages(conversationId);
  return sortMessages(
    extractList(dto)
      .map((item) => normalizeMessage(item, { conversationId, type: "TEAM" }))
      .filter((item) => Boolean(item.id && item.conversationId))
  );
}

export async function sendTeamMessage(conversationId: string, senderEmployeeId: ChatId, message: string): Promise<ChatMessage> {
  const dto = await postTeamConversationMessage(conversationId, {
    senderEmployeeId,
    message,
  });

  return normalizeMessage(dto, { conversationId, type: "TEAM" });
}

export async function markChatMessageAsRead(chatType: ChatType, messageId: ChatId): Promise<ChatReadReceipt> {
  const dto = await postReadReceipt({
    chatType,
    messageId,
  });

  return normalizeReadReceipt(dto, {
    chatType,
    messageId: String(messageId),
  });
}

export async function listChatReadReceipts(chatType: ChatType, messageId: ChatId): Promise<ChatReadReceipt[]> {
  const dto = await getReadReceipts({
    chatType,
    messageId,
  });

  const direct = extractList(dto);
  const receipts = direct.length > 0 ? direct : (isRecord(dto) && Array.isArray(dto.receipts) ? dto.receipts : []);

  return receipts.map((item) =>
    normalizeReadReceipt(item, {
      chatType,
      messageId: String(messageId),
    })
  );
}

export async function listMyConversations(): Promise<ChatConversation[]> {
  const [teamResult, hrResult] = await Promise.allSettled([listMyTeamConversations(), listMyHrConversations()]);

  const teamConversations = teamResult.status === "fulfilled" ? teamResult.value : [];
  const hrConversations = hrResult.status === "fulfilled" ? hrResult.value : [];

  return sortConversations([...teamConversations, ...hrConversations]);
}

export async function listConversationMessages(type: ChatType, conversationId: string): Promise<ChatMessage[]> {
  if (type === "HR") {
    return listHrConversationMessages(conversationId);
  }
  return listTeamConversationMessages(conversationId);
}

export async function sendConversationMessage(input: SendChatMessageInput): Promise<ChatMessage> {
  if (input.type === "HR") {
    return sendHrMessage(input.conversationId, input.senderEmployeeId, input.message);
  }

  return sendTeamMessage(input.conversationId, input.senderEmployeeId, input.message);
}

export async function markConversationMessagesAsRead(options: {
  conversation: Pick<ChatConversation, "id" | "type">;
  messages: ChatMessage[];
  viewerEmployeeId: string;
  alreadyMarkedMessageIds?: Set<string>;
}): Promise<string[]> {
  if (!options.conversation.id) return [];

  if (options.conversation.type === "HR") {
    await markHrConversationMessagesAsRead(options.conversation.id);
    return [];
  }

  const alreadyMarked = options.alreadyMarkedMessageIds ?? new Set<string>();
  const messageIdsToMark = options.messages
    .filter((message) => message.senderEmployeeId !== options.viewerEmployeeId)
    .map((message) => message.id)
    .filter((id) => Boolean(id) && !alreadyMarked.has(id));

  if (messageIdsToMark.length === 0) return [];

  const results = await Promise.allSettled(
    messageIdsToMark.map((id) =>
      markChatMessageAsRead("TEAM", id).then(() => id)
    )
  );

  return results
    .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
    .map((result) => result.value);
}

function buildRealtimeDestinations(conversation: { id: string; type: ChatType } | null): string[] {
  if (!conversation) return [...CHAT_GLOBAL_REALTIME_DESTINATIONS];

  const typeKey = conversation.type.toLowerCase();
  const scoped = [
    `/topic/tenant/chats/${typeKey}/conversations/${conversation.id}`,
    `/topic/tenant/chats/${typeKey}/${conversation.id}`,
    `/topic/tenant/chats/conversations/${conversation.id}`,
    `/user/queue/chats/${conversation.id}`,
    `/user/queue/messages/${conversation.id}`,
  ];

  return [...new Set([...CHAT_GLOBAL_REALTIME_DESTINATIONS, ...scoped])];
}

export function subscribeChatRealtime(
  conversation: { id: string; type: ChatType } | null,
  listener: RealtimeListener
): () => void {
  const destinations = buildRealtimeDestinations(conversation);
  return subscribeRealtime(destinations, listener);
}

function tryNormalizeRealtimeCandidate(
  candidate: unknown,
  hint: { id: string; type: ChatType } | null
): ChatMessage | null {
  if (!isRecord(candidate)) return null;

  const hasBody =
    getString(candidate.message) !== undefined ||
    getString(candidate.content) !== undefined ||
    getString(candidate.text) !== undefined;
  const explicitMessageId = getId(candidate.messageId);

  const sender = asRecord(candidate.sender);
  const hasSenderSignal =
    getId(firstDefined(candidate.senderEmployeeId, candidate.senderId, sender.id)) !== "" ||
    getString(firstDefined(candidate.senderName, sender.fullName, sender.name, sender.email)) !== undefined;
  const hasTypeSignal = parseChatType(candidate.chatType) !== undefined;
  const hasTimestampSignal = getString(firstDefined(candidate.createdAt, candidate.sentAt, candidate.timestamp)) !== undefined;

  const explicitConversationId = getId(
    firstDefined(candidate.conversationId, candidate.chatId, candidate.hrConversationId, candidate.teamChatId)
  );
  const fallbackConversationId = explicitConversationId;
  const fallbackType = hint?.type ?? parseChatType(candidate.chatType) ?? "TEAM";

  const hasMessageShape = hasSenderSignal || hasTypeSignal || hasTimestampSignal || Boolean(explicitMessageId);

  if (!fallbackConversationId) return null;
  if (!hasBody && !explicitMessageId) return null;
  if (!hasMessageShape) return null;

  const normalized = normalizeMessage(candidate, {
    conversationId: fallbackConversationId,
    type: fallbackType,
  });

  if (!normalized.id || !normalized.conversationId) return null;
  return normalized;
}

export function parseRealtimeMessage(
  payload: unknown,
  conversationHint: { id: string; type: ChatType } | null
): ChatMessage | null {
  const candidates: unknown[] = [payload];

  if (isRecord(payload)) {
    candidates.push(payload.data);
    candidates.push(payload.message);
    candidates.push(payload.payload);

    const event = asRecord(payload.event);
    candidates.push(event.data);
    candidates.push(event.message);
  }

  for (const candidate of candidates) {
    const parsed = tryNormalizeRealtimeCandidate(candidate, conversationHint);
    if (parsed) return parsed;
  }

  return null;
}

// Backward-compatible APIs used by the legacy chat page.
export async function getConversations(): Promise<ChatConversation[]> {
  return listMyConversations();
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const knownType = conversationTypeById.get(conversationId);
  if (knownType) {
    return listConversationMessages(knownType, conversationId);
  }

  try {
    const hrMessages = await listHrConversationMessages(conversationId);
    conversationTypeById.set(conversationId, "HR");
    return hrMessages;
  } catch {
    const teamMessages = await listTeamConversationMessages(conversationId);
    conversationTypeById.set(conversationId, "TEAM");
    return teamMessages;
  }
}

export async function sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
  const type = coerceChatType((conversationTypeById.get(payload.conversationId) ?? "TEAM") as ChatTypeDto);
  const sent = await sendConversationMessage({
    type,
    conversationId: payload.conversationId,
    senderEmployeeId: payload.senderId,
    message: payload.content,
  });

  rememberConversationType({ id: payload.conversationId, type });
  return sent;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  const type = conversationTypeById.get(conversationId);
  if (!type) return;

  if (type === "HR") {
    await markHrConversationMessagesAsRead(conversationId);
    return;
  }

  const viewerId = useAuthStore.getState().user?.id;
  if (!viewerId) return;

  const messages = await listTeamConversationMessages(conversationId);
  await markConversationMessagesAsRead({
    conversation: { id: conversationId, type: "TEAM" },
    messages,
    viewerEmployeeId: viewerId,
  });
}

export type { ChatType, ConversationType };

