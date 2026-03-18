export type ChatType = "TEAM" | "HR";
export type ConversationType = ChatType;

export interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface ChatConversation {
  id: string;
  type: ChatType;
  title: string;
  subtitle: string;
  participants: ChatParticipant[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  teamId?: string;
  teamName?: string;
  employeeId?: string;
  hrId?: string;
  // Backward-compatible alias used by legacy components.
  name: string;
}

export interface ChatMessage {
  id: string;
  chatType: ChatType;
  conversationId: string;
  senderEmployeeId: string;
  senderName: string;
  message: string;
  createdAt: string;
  editedAt?: string;
  // Backward-compatible aliases used by legacy components.
  senderId: string;
  content: string;
}

export interface ChatReadReceipt {
  id: string;
  chatType: ChatType;
  messageId: string;
  readerEmployeeId: string;
  readerName: string;
  readAt: string;
}

export interface SendChatMessageInput {
  type: ChatType;
  conversationId: string;
  senderEmployeeId: string;
  message: string;
}

// Backward-compatible alias used by legacy chat page implementation.
export interface SendMessagePayload {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
}

