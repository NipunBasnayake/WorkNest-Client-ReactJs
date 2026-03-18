import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { ApiResponse } from "@/types";

export type ChatId = string | number;
export type ChatTypeDto = "TEAM" | "HR";

export interface ChatEmployeeDto {
  id: ChatId;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface HrConversationDto {
  id: ChatId;
  employeeId?: ChatId;
  hrId?: ChatId;
  employee?: ChatEmployeeDto;
  hr?: ChatEmployeeDto;
  participants?: ChatEmployeeDto[];
  members?: ChatEmployeeDto[];
  name?: string;
  conversationName?: string;
  lastMessage?: string;
  preview?: string;
  unreadCount?: number;
  unreadMessages?: number;
  lastMessageAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface HrConversationTargetsDto {
  hrTargets?: ChatEmployeeDto[];
  employeeTargets?: ChatEmployeeDto[];
}

export interface TeamConversationDto {
  id: ChatId;
  teamId?: ChatId;
  teamName?: string;
  team?: {
    id?: ChatId;
    name?: string;
  };
  participants?: ChatEmployeeDto[];
  members?: ChatEmployeeDto[];
  name?: string;
  conversationName?: string;
  lastMessage?: string;
  preview?: string;
  unreadCount?: number;
  unreadMessages?: number;
  lastMessageAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface ChatMessageDto {
  id: ChatId;
  conversationId?: ChatId;
  chatId?: ChatId;
  senderEmployeeId?: ChatId;
  senderId?: ChatId;
  senderName?: string;
  sender?: ChatEmployeeDto;
  message?: string;
  content?: string;
  text?: string;
  chatType?: ChatTypeDto;
  createdAt?: string;
  sentAt?: string;
  timestamp?: string;
  updatedAt?: string;
}

export interface ChatReadReceiptDto {
  id: ChatId;
  chatType: ChatTypeDto;
  messageId: ChatId;
  readerEmployeeId?: ChatId;
  readerId?: ChatId;
  reader?: ChatEmployeeDto;
  readAt?: string;
  createdAt?: string;
}

export interface CreateHrConversationRequest {
  employeeId: ChatId;
  hrId: ChatId;
}

export interface SendHrMessageRequest {
  senderEmployeeId: ChatId;
  message: string;
}

export interface CreateTeamConversationRequest {
  teamId: ChatId;
}

export interface SendTeamMessageRequest {
  senderEmployeeId: ChatId;
  message: string;
}

export interface CreateReadReceiptRequest {
  chatType: ChatTypeDto;
  messageId: ChatId;
}

export interface ListReadReceiptsQuery {
  chatType: ChatTypeDto;
  messageId: ChatId;
}

export type EmptyApiData = Record<string, never>;

async function unwrap<T>(promise: Promise<AxiosResponse<ApiResponse<T> | T>>): Promise<T> {
  const response = await promise;
  return unwrapApiData<T>(response.data);
}

export async function postHrConversation(
  payload: CreateHrConversationRequest,
  config?: AxiosRequestConfig
): Promise<HrConversationDto> {
  return unwrap(
    apiClient.post<ApiResponse<HrConversationDto> | HrConversationDto>("/api/tenant/chats/hr/conversations", payload, config)
  );
}

export async function getMyHrConversations(config?: AxiosRequestConfig): Promise<HrConversationDto[] | { conversations: HrConversationDto[] }> {
  return unwrap(
    apiClient.get<ApiResponse<HrConversationDto[] | { conversations: HrConversationDto[] }> | HrConversationDto[] | { conversations: HrConversationDto[] }>(
      "/api/tenant/chats/hr/conversations/my",
      config
    )
  );
}

export async function getHrConversationTargets(config?: AxiosRequestConfig): Promise<HrConversationTargetsDto> {
  return unwrap(
    apiClient.get<ApiResponse<HrConversationTargetsDto> | HrConversationTargetsDto>(
      "/api/tenant/chats/hr/targets",
      config
    )
  );
}

export async function getHrConversationMessages(
  conversationId: ChatId,
  config?: AxiosRequestConfig
): Promise<ChatMessageDto[] | { messages: ChatMessageDto[] }> {
  return unwrap(
    apiClient.get<ApiResponse<ChatMessageDto[] | { messages: ChatMessageDto[] }> | ChatMessageDto[] | { messages: ChatMessageDto[] }>(
      `/api/tenant/chats/hr/conversations/${conversationId}/messages`,
      config
    )
  );
}

export async function postHrConversationMessage(
  conversationId: ChatId,
  payload: SendHrMessageRequest,
  config?: AxiosRequestConfig
): Promise<ChatMessageDto> {
  return unwrap(
    apiClient.post<ApiResponse<ChatMessageDto> | ChatMessageDto>(
      `/api/tenant/chats/hr/conversations/${conversationId}/messages`,
      payload,
      config
    )
  );
}

export async function patchHrConversationRead(
  conversationId: ChatId,
  config?: AxiosRequestConfig
): Promise<EmptyApiData> {
  return unwrap(
    apiClient.patch<ApiResponse<EmptyApiData> | EmptyApiData>(
      `/api/tenant/chats/hr/conversations/${conversationId}/read`,
      {},
      config
    )
  );
}

export async function postTeamConversation(
  payload: CreateTeamConversationRequest,
  config?: AxiosRequestConfig
): Promise<TeamConversationDto> {
  return unwrap(
    apiClient.post<ApiResponse<TeamConversationDto> | TeamConversationDto>("/api/tenant/chats/team/conversations", payload, config)
  );
}

export async function getTeamConversationByTeam(
  teamId: ChatId,
  config?: AxiosRequestConfig
): Promise<TeamConversationDto> {
  return unwrap(
    apiClient.get<ApiResponse<TeamConversationDto> | TeamConversationDto>(`/api/tenant/chats/team/conversations/team/${teamId}`, config)
  );
}

export async function getMyTeamConversations(
  config?: AxiosRequestConfig
): Promise<TeamConversationDto[] | { conversations: TeamConversationDto[] }> {
  return unwrap(
    apiClient.get<ApiResponse<TeamConversationDto[] | { conversations: TeamConversationDto[] }> | TeamConversationDto[] | { conversations: TeamConversationDto[] }>(
      "/api/tenant/chats/team/conversations/my",
      config
    )
  );
}

export async function getTeamConversationMessages(
  conversationId: ChatId,
  config?: AxiosRequestConfig
): Promise<ChatMessageDto[] | { messages: ChatMessageDto[] }> {
  return unwrap(
    apiClient.get<ApiResponse<ChatMessageDto[] | { messages: ChatMessageDto[] }> | ChatMessageDto[] | { messages: ChatMessageDto[] }>(
      `/api/tenant/chats/team/conversations/${conversationId}/messages`,
      config
    )
  );
}

export async function postTeamConversationMessage(
  conversationId: ChatId,
  payload: SendTeamMessageRequest,
  config?: AxiosRequestConfig
): Promise<ChatMessageDto> {
  return unwrap(
    apiClient.post<ApiResponse<ChatMessageDto> | ChatMessageDto>(
      `/api/tenant/chats/team/conversations/${conversationId}/messages`,
      payload,
      config
    )
  );
}

export async function postReadReceipt(
  payload: CreateReadReceiptRequest,
  config?: AxiosRequestConfig
): Promise<ChatReadReceiptDto> {
  return unwrap(
    apiClient.post<ApiResponse<ChatReadReceiptDto> | ChatReadReceiptDto>("/api/tenant/chats/read-receipts", payload, config)
  );
}

export async function getReadReceipts(
  query: ListReadReceiptsQuery,
  config?: AxiosRequestConfig
): Promise<ChatReadReceiptDto[] | { receipts: ChatReadReceiptDto[] }> {
  return unwrap(
    apiClient.get<ApiResponse<ChatReadReceiptDto[] | { receipts: ChatReadReceiptDto[] }> | ChatReadReceiptDto[] | { receipts: ChatReadReceiptDto[] }>(
      "/api/tenant/chats/read-receipts",
      {
        ...config,
        params: {
          ...config?.params,
          chatType: query.chatType,
          messageId: query.messageId,
        },
      }
    )
  );
}

