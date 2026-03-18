import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createHrConversation,
  createTeamConversation,
  getOrCreateTeamConversationByTeam,
  listConversationMessages,
  listMyHrConversations,
  listMyTeamConversations,
  markConversationMessagesAsRead,
  parseRealtimeMessage,
  sendConversationMessage,
  subscribeChatRealtime,
} from "@/modules/chat/services/chatService";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import type { ChatConversation, ChatMessage, ChatType } from "@/modules/chat/types";

interface RefreshOptions {
  silent?: boolean;
  force?: boolean;
}

function buildConversationKey(conversation: Pick<ChatConversation, "id" | "type">): string {
  return `${conversation.type}:${conversation.id}`;
}

function sortConversations(conversations: ChatConversation[]): ChatConversation[] {
  return [...conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function clearUnread(conversations: ChatConversation[], conversationId: string): ChatConversation[] {
  return conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;
    return {
      ...conversation,
      unreadCount: 0,
    };
  });
}

function upsertMessage(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const index = messages.findIndex((message) => message.id === incoming.id);
  if (index >= 0) {
    const next = [...messages];
    next[index] = incoming;
    return sortMessages(next);
  }

  return sortMessages([...messages, incoming]);
}

function trimSeenRealtimeMap(seen: Map<string, number>): void {
  if (seen.size <= 500) return;
  const sortedEntries = [...seen.entries()].sort((a, b) => a[1] - b[1]);
  const removeCount = seen.size - 350;
  for (let index = 0; index < removeCount; index += 1) {
    const key = sortedEntries[index]?.[0];
    if (key) seen.delete(key);
  }
}

function createRealtimeMessageKey(message: ChatMessage): string {
  return `${message.chatType}:${message.conversationId}:${message.id}`;
}

function placeConversationOnTop(conversations: ChatConversation[], incoming: ChatConversation): ChatConversation[] {
  const withoutTarget = conversations.filter(
    (conversation) => !(conversation.id === incoming.id && conversation.type === incoming.type)
  );
  return [incoming, ...withoutTarget];
}

function updateConversationPreview(
  conversations: ChatConversation[],
  message: ChatMessage,
  incrementUnread: boolean
): { next: ChatConversation[]; found: boolean } {
  let found = false;
  const next = conversations.map((conversation) => {
    if (conversation.id !== message.conversationId || conversation.type !== message.chatType) return conversation;
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

export function useChat(currentUserId: string | undefined) {
  const [activeTab, setActiveTab] = useState<ChatType>("TEAM");
  const [teamConversations, setTeamConversations] = useState<ChatConversation[]>([]);
  const [hrConversations, setHrConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationKey, setSelectedConversationKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerEmployeeId, setViewerEmployeeId] = useState<string | undefined>(undefined);

  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(false);
  const activeTabRef = useRef<ChatType>(activeTab);
  const viewerEmployeeIdRef = useRef<string | undefined>(viewerEmployeeId);
  const selectedConversationRef = useRef<ChatConversation | null>(null);
  const selectedConversationKeyRef = useRef<string | null>(selectedConversationKey);

  const markedTeamMessageIdsRef = useRef<Set<string>>(new Set());
  const seenRealtimeMessageIdsRef = useRef<Map<string, number>>(new Map());

  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const refreshVersionRef = useRef<number>(0);
  const messageLoadVersionRef = useRef<number>(0);

  const lastSilentRefreshAtRef = useRef<number>(0);
  const silentRefreshTimerRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const activeConversations = useMemo(
    () => (activeTab === "TEAM" ? teamConversations : hrConversations),
    [activeTab, hrConversations, teamConversations]
  );

  const selectedConversation = useMemo(() => {
    if (!selectedConversationKey) return null;
    const all = [...teamConversations, ...hrConversations];
    return all.find((conversation) => buildConversationKey(conversation) === selectedConversationKey) ?? null;
  }, [hrConversations, selectedConversationKey, teamConversations]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (silentRefreshTimerRef.current !== null) {
        window.clearTimeout(silentRefreshTimerRef.current);
        silentRefreshTimerRef.current = null;
      }
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    selectedConversationKeyRef.current = selectedConversation
      ? buildConversationKey(selectedConversation)
      : null;
  }, [selectedConversation]);

  useEffect(() => {
    selectedConversationKeyRef.current = selectedConversationKey;
  }, [selectedConversationKey]);

  useEffect(() => {
    viewerEmployeeIdRef.current = viewerEmployeeId;
  }, [viewerEmployeeId]);

  useEffect(() => {
    let active = true;

    if (!currentUserId) {
      setViewerEmployeeId(undefined);
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const profile = await getMyEmployeeProfile();
        if (!active || !mountedRef.current) return;
        if (profile.id) {
          setViewerEmployeeId(profile.id);
        } else {
          setViewerEmployeeId(undefined);
        }
      } catch {
        if (!active || !mountedRef.current) return;
        setViewerEmployeeId(undefined);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const refreshConversations = useCallback(
    async (options?: RefreshOptions): Promise<void> => {
      const silent = options?.silent ?? false;
      const force = options?.force ?? false;

      if (refreshInFlightRef.current && !force) {
        if (!silent) {
          setIsLoadingConversations(true);
        }

        try {
          await refreshInFlightRef.current;
        } finally {
          if (!silent && mountedRef.current) {
            setIsLoadingConversations(false);
          }
        }
        return;
      }

      if (!silent) {
        setIsLoadingConversations(true);
      }

      const refreshVersion = ++refreshVersionRef.current;

      const request = (async () => {
        const [teamResult, hrResult] = await Promise.allSettled([
          listMyTeamConversations(),
          listMyHrConversations(),
        ]);

        if (!mountedRef.current || refreshVersion !== refreshVersionRef.current) return;

        const nextTeam = teamResult.status === "fulfilled" ? teamResult.value : [];
        const nextHr = hrResult.status === "fulfilled" ? hrResult.value : [];
        const available = [...nextTeam, ...nextHr];

        setTeamConversations(nextTeam);
        setHrConversations(nextHr);

        setSelectedConversationKey((previous) => {
          const target = previous ?? selectedConversationKeyRef.current;
          if (target && available.some((conversation) => buildConversationKey(conversation) === target)) {
            return target;
          }

          const nextByTab = activeTabRef.current === "TEAM" ? nextTeam[0] : nextHr[0];
          const fallback = nextByTab ?? available[0] ?? null;
          return fallback ? buildConversationKey(fallback) : null;
        });

        if (teamResult.status === "rejected" && hrResult.status === "rejected") {
          setError("Unable to load chat conversations.");
        } else {
          setError(null);
        }
      })();

      refreshInFlightRef.current = request;

      try {
        await request;
      } finally {
        if (refreshInFlightRef.current === request) {
          refreshInFlightRef.current = null;
        }

        if (!silent && mountedRef.current && refreshVersion === refreshVersionRef.current) {
          setIsLoadingConversations(false);
        }
      }
    },
    []
  );

  const scheduleSilentConversationRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastSilentRefreshAtRef.current < 3000) return;
    if (silentRefreshTimerRef.current !== null) return;

    silentRefreshTimerRef.current = window.setTimeout(() => {
      silentRefreshTimerRef.current = null;
      lastSilentRefreshAtRef.current = Date.now();
      void refreshConversations({ silent: true });
    }, 250);
  }, [refreshConversations]);

  const shouldIgnoreIncomingRealtimeMessage = useCallback((incoming: ChatMessage): boolean => {
    const key = createRealtimeMessageKey(incoming);
    const now = Date.now();
    const seen = seenRealtimeMessageIdsRef.current;
    const lastSeen = seen.get(key);

    if (lastSeen && now - lastSeen < 12_000) {
      return true;
    }

    seen.set(key, now);
    trimSeenRealtimeMap(seen);
    return false;
  }, []);

  const markSelectedConversationAsRead = useCallback(
    async (conversation: ChatConversation, threadMessages: ChatMessage[]): Promise<void> => {
      const resolvedViewerId = viewerEmployeeIdRef.current;
      if (!resolvedViewerId || !conversation.id) return;

      try {
        const markedIds = await markConversationMessagesAsRead({
          conversation,
          messages: threadMessages,
          viewerEmployeeId: resolvedViewerId,
          alreadyMarkedMessageIds: markedTeamMessageIdsRef.current,
        });

        markedIds.forEach((id) => markedTeamMessageIdsRef.current.add(id));

        if (conversation.type === "TEAM") {
          setTeamConversations((previous) => clearUnread(previous, conversation.id));
        } else {
          setHrConversations((previous) => clearUnread(previous, conversation.id));
        }
      } catch {
        // Ignore read-marking failures to avoid blocking core chat behavior.
      }
    },
    []
  );

  const loadSelectedConversationMessages = useCallback(
    async (conversation: ChatConversation): Promise<void> => {
      if (!conversation.id) {
        setMessages([]);
        setError("Unable to load messages for this conversation.");
        return;
      }

      const loadVersion = ++messageLoadVersionRef.current;
      setIsLoadingMessages(true);
      setError(null);

      try {
        const threadMessages = await listConversationMessages(conversation.type, conversation.id);
        if (!mountedRef.current || loadVersion !== messageLoadVersionRef.current) return;

        setMessages(threadMessages);
        await markSelectedConversationAsRead(conversation, threadMessages);
      } catch {
        if (!mountedRef.current || loadVersion !== messageLoadVersionRef.current) return;
        setMessages([]);
        setError("Unable to load messages for this conversation.");
      } finally {
        if (mountedRef.current && loadVersion === messageLoadVersionRef.current) {
          setIsLoadingMessages(false);
        }
      }
    },
    [markSelectedConversationAsRead]
  );

  const handleIncomingMessage = useCallback(
    (incoming: ChatMessage) => {
      if (!incoming.id || !incoming.conversationId) return;
      if (shouldIgnoreIncomingRealtimeMessage(incoming)) return;

      const selected = selectedConversationRef.current;
      const resolvedViewerId = viewerEmployeeIdRef.current;
      const mine = resolvedViewerId ? incoming.senderEmployeeId === resolvedViewerId : false;
      const isSelected =
        selected !== null &&
        selected.id === incoming.conversationId &&
        selected.type === incoming.chatType;

      if (isSelected) {
        setMessages((previous) => upsertMessage(previous, incoming));

        if (!mine && selected) {
          void markSelectedConversationAsRead(selected, [incoming]);
        }
      }

      if (incoming.chatType === "TEAM") {
        setTeamConversations((previous) => {
          const updated = updateConversationPreview(previous, incoming, !isSelected && !mine);
          if (!updated.found) {
            scheduleSilentConversationRefresh();
          }
          return updated.next;
        });
      } else {
        setHrConversations((previous) => {
          const updated = updateConversationPreview(previous, incoming, !isSelected && !mine);
          if (!updated.found) {
            scheduleSilentConversationRefresh();
          }
          return updated.next;
        });
      }
    },
    [markSelectedConversationAsRead, scheduleSilentConversationRefresh, shouldIgnoreIncomingRealtimeMessage]
  );

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const selected = selectedConversationRef.current;
      const resolvedViewerId = viewerEmployeeIdRef.current;
      if (!selected || !selected.id) return;
      if (!resolvedViewerId) {
        setError("Current employee profile could not be resolved.");
        return;
      }

      const trimmed = text.trim();
      if (!trimmed) return;

      setIsSending(true);
      setError(null);

      try {
        const created = await sendConversationMessage({
          type: selected.type,
          conversationId: selected.id,
          senderEmployeeId: resolvedViewerId,
          message: trimmed,
        });

        const fallbackMessage: ChatMessage = {
          id: created.id || `local:${selected.type}:${selected.id}:${Date.now()}`,
          chatType: created.chatType ?? selected.type,
          conversationId: created.conversationId || selected.id,
          senderEmployeeId: created.senderEmployeeId || resolvedViewerId,
          senderName: created.senderName || "You",
          message: created.message || trimmed,
          createdAt: created.createdAt || new Date().toISOString(),
          editedAt: created.editedAt,
          senderId: created.senderId || created.senderEmployeeId || resolvedViewerId,
          content: created.content || created.message || trimmed,
        };

        const selectedKey = buildConversationKey(selected);
        if (selectedConversationKeyRef.current === selectedKey) {
          setMessages((previous) => upsertMessage(previous, fallbackMessage));
        }

        if (selected.type === "TEAM") {
          setTeamConversations((previous) => updateConversationPreview(previous, fallbackMessage, false).next);
        } else {
          setHrConversations((previous) => updateConversationPreview(previous, fallbackMessage, false).next);
        }

        if (!created.id || !created.message?.trim()) {
          const refreshedThread = await listConversationMessages(selected.type, selected.id);
          if (mountedRef.current && selectedConversationKeyRef.current === selectedKey) {
            setMessages(refreshedThread);
          }
          await refreshConversations({ silent: true });
        }
      } catch {
        setError("Unable to send the message.");
        throw new Error("Unable to send the message.");
      } finally {
        if (mountedRef.current) {
          setIsSending(false);
        }
      }
    },
    [refreshConversations]
  );

  const startTeamConversation = useCallback(
    async (teamId: string): Promise<ChatConversation> => {
      const normalizedTeamId = teamId.trim();
      if (!normalizedTeamId) {
        throw new Error("A valid team id is required.");
      }

      setError(null);
      let created = await createTeamConversation(normalizedTeamId);
      if (!created.id) {
        created = await getOrCreateTeamConversationByTeam(normalizedTeamId);
      }

      if (!created.id) {
        throw new Error("Unable to resolve the team conversation.");
      }

      setActiveTab("TEAM");
      setTeamConversations((previous) => placeConversationOnTop(previous, created));
      setSelectedConversationKey(buildConversationKey(created));
      setMessages([]);
      return created;
    },
    []
  );

  const startHrConversation = useCallback(
    async (employeeId: string, hrId: string): Promise<ChatConversation> => {
      const normalizedEmployeeId = employeeId.trim();
      const normalizedHrId = hrId.trim();
      if (!normalizedEmployeeId || !normalizedHrId) {
        throw new Error("Both employee and HR ids are required.");
      }

      setError(null);
      let created = await createHrConversation(normalizedEmployeeId, normalizedHrId);

      if (!created.id) {
        const refreshed = await listMyHrConversations();
        created =
          refreshed.find((conversation) => {
            const pairA = conversation.employeeId === normalizedEmployeeId && conversation.hrId === normalizedHrId;
            const pairB = conversation.employeeId === normalizedHrId && conversation.hrId === normalizedEmployeeId;
            return pairA || pairB;
          }) ??
          refreshed[0] ??
          created;
      }

      if (!created.id) {
        throw new Error("Unable to resolve the HR conversation.");
      }

      setActiveTab("HR");
      setHrConversations((previous) => placeConversationOnTop(previous, created));
      setSelectedConversationKey(buildConversationKey(created));
      setMessages([]);
      return created;
    },
    []
  );

  const selectConversation = useCallback(
    (conversationId: string) => {
      const target = activeConversations.find((conversation) => conversation.id === conversationId);
      if (!target) return;
      setSelectedConversationKey(buildConversationKey(target));
    },
    [activeConversations]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    const selected = selectedConversationRef.current;
    if (!selectedConversationKey || !selected) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    void loadSelectedConversationMessages(selected);
  }, [loadSelectedConversationMessages, selectedConversationKey]);

  useEffect(() => {
    if (selectedConversation && selectedConversation.type === activeTab) return;

    const firstConversation = activeConversations[0] ?? null;
    setSelectedConversationKey(firstConversation ? buildConversationKey(firstConversation) : null);
  }, [activeConversations, activeTab, selectedConversation]);

  useEffect(() => {
    const unsubscribe = subscribeChatRealtime(null, (payload) => {
      const selected = selectedConversationRef.current;
      const conversationHint = selected
        ? {
            id: selected.id,
            type: selected.type,
          }
        : null;
      const incoming = parseRealtimeMessage(payload, conversationHint);

      if (incoming) {
        handleIncomingMessage(incoming);
        return;
      }

      scheduleSilentConversationRefresh();
    });

    return () => {
      unsubscribe();
      if (silentRefreshTimerRef.current !== null) {
        window.clearTimeout(silentRefreshTimerRef.current);
        silentRefreshTimerRef.current = null;
      }
    };
  }, [handleIncomingMessage, scheduleSilentConversationRefresh]);

  // Polling fallback for realtime updates
  useEffect(() => {
    if (!selectedConversation?.id) {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Poll for new messages every 3 seconds
    pollingIntervalRef.current = window.setInterval(() => {
      if (!mountedRef.current) return;
      const selected = selectedConversationRef.current;
      if (!selected?.id) return;

      void (async () => {
        try {
          const latestMessages = await listConversationMessages(selected.type, selected.id);
          if (!mountedRef.current) return;
          if (selectedConversationKeyRef.current !== buildConversationKey(selected)) return;

          // Update messages if we got new ones
          setMessages((currentMessages) => {
            const currentIds = new Set(currentMessages.map((m) => m.id));
            const newMessages = latestMessages.filter((m) => !currentIds.has(m.id));

            if (newMessages.length > 0) {
              // Mark new messages as read
              void markSelectedConversationAsRead(selected, newMessages);
              return sortMessages([...currentMessages, ...newMessages]);
            }

            return currentMessages;
          });

          // Update conversation preview
          if (latestMessages.length > 0) {
            const lastMessage = latestMessages[latestMessages.length - 1];
            if (lastMessage) {
              if (selected.type === "TEAM") {
                setTeamConversations((prev) => updateConversationPreview(prev, lastMessage, false).next);
              } else {
                setHrConversations((prev) => updateConversationPreview(prev, lastMessage, false).next);
              }
            }
          }
        } catch {
          // Silent failure - realtime will catch up on next poll
        }
      })();
    }, 3000);

    return () => {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedConversation, markSelectedConversationAsRead]);

  // Poll for conversation updates every 10 seconds
  useEffect(() => {
    const conversationPollInterval = window.setInterval(() => {
      if (!mountedRef.current) return;
      void refreshConversations({ silent: true });
    }, 10000);

    return () => {
      window.clearInterval(conversationPollInterval);
    };
  }, [refreshConversations]);

  return {
    activeTab,
    setActiveTab,
    currentEmployeeId: viewerEmployeeId,
    conversations: activeConversations,
    teamConversations,
    hrConversations,
    selectedConversation,
    selectedConversationId: selectedConversation?.id ?? null,
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
  };
}

