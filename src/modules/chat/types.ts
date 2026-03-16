export type ConversationType = "TEAM" | "HR" | "DIRECT";

export interface ChatConversation {
  id: string;
  name: string;
  type: ConversationType;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface SendMessagePayload {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
}
