import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createOrGetMyHrSupportConversation,
  getRealtimeConversationHint,
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
import { buildConversationKey, sortMessages, toRole } from "@/app/chat/chatUtils";
import {
  areMessagesEquivalent,
  clearUnread,
  createRealtimeMessageKey,
  placeConversationOnTop,
  trimSeenRealtimeMap,
  updateConversationPreview,
  upsertMessage,
} from "@/app/chat/useChat.helpers";

interface RefreshOptions {
  silent?: boolean;
  force?: boolean;
}

export function useChat(currentUserId: string | undefined, currentUserRole: string | undefined) {
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
  const viewerEmployeeIdRef = useRef<string | undefined>(viewerEmployeeId);
  const selectedConversationRef = useRef<ChatConversation | null>(null);
  const selectedConversationKeyRef = useRef<string | null>(selectedConversationKey);
  const messagesRef = useRef<ChatMessage[]>(messages);

  const markedTeamMessageIdsRef = useRef<Set<string>>(new Set());
  const seenRealtimeMessageIdsRef = useRef<Map<string, number>>(new Map());

  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const refreshVersionRef = useRef<number>(0);
  const messageLoadVersionRef = useRef<number>(0);

  const lastSilentRefreshAtRef = useRef<number>(0);
  const silentRefreshTimerRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const normalizedRole = useMemo(() => toRole(currentUserRole), [currentUserRole]);
  const isAdminObserver = normalizedRole === "TENANT_ADMIN" || normalizedRole === "ADMIN";
  const canOpenHrSupport = Boolean(viewerEmployeeId && !isAdminObserver && normalizedRole !== "HR");

  const allConversations = useMemo(
    () => [...teamConversations, ...hrConversations],
    [hrConversations, teamConversations]
  );

  // Stable string key that only changes when conversations are added or removed (not on preview updates)
  const conversationSubKey = useMemo(
    () =>
      allConversations
        .map((c) => `${c.type}:${c.id}`)
        .sort()
        .join(","),
    [allConversations]
  );

  const selectedConversation = useMemo(() => {
    if (!selectedConversationKey) return null;
    return allConversations.find((conversation) => buildConversationKey(conversation) === selectedConversationKey) ?? null;
  }, [allConversations, selectedConversationKey]);

  const canSendSelectedConversation = useMemo(() => {
    if (!viewerEmployeeId || !selectedConversation) return false;
    if (selectedConversation.type === "TEAM") return true;
    return !isAdminObserver;
  }, [isAdminObserver, selectedConversation, viewerEmployeeId]);

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
    selectedConversationRef.current = selectedConversation;
    selectedConversationKeyRef.current = selectedConversation
      ? buildConversationKey(selectedConversation)
      : null;
  }, [selectedConversation]);

  useEffect(() => {
    selectedConversationKeyRef.current = selectedConversationKey;
  }, [selectedConversationKey]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    viewerEmployeeIdRef.current = viewerEmployeeId;
  }, [viewerEmployeeId]);

  useEffect(() => {
    let active = true;

    if (!currentUserId) {
      setViewerEmployeeId(undefined);
      setTeamConversations([]);
      setHrConversations([]);
      setSelectedConversationKey(null);
      setMessages([]);
      setIsLoadingConversations(false);
      setIsLoadingMessages(false);
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

          const fallback = nextTeam[0] ?? nextHr[0] ?? available[0] ?? null;
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
          setTeamConversations((previous) => clearUnread(previous, conversation));
        } else {
          setHrConversations((previous) => clearUnread(previous, conversation));
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
      const requestedKey = buildConversationKey(conversation);
      setMessages([]);
      setIsLoadingMessages(true);
      setError(null);

      try {
        const threadMessages = sortMessages(await listConversationMessages(conversation.type, conversation.id));
        if (!mountedRef.current || loadVersion !== messageLoadVersionRef.current) return;
        if (selectedConversationKeyRef.current !== requestedKey) return;

        setMessages(threadMessages);
        await markSelectedConversationAsRead(conversation, threadMessages);
      } catch {
        if (!mountedRef.current || loadVersion !== messageLoadVersionRef.current) return;
        if (selectedConversationKeyRef.current !== requestedKey) return;
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
        setMessages((previous) => {
          const next = upsertMessage(previous, incoming);
          return areMessagesEquivalent(previous, next) ? previous : next;
        });

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
      if (selected.type === "HR" && isAdminObserver) {
        setError("Admins can observe HR support conversations but cannot reply.");
        return;
      }
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
        seenRealtimeMessageIdsRef.current.set(createRealtimeMessageKey(fallbackMessage), Date.now());
        trimSeenRealtimeMap(seenRealtimeMessageIdsRef.current);

        const selectedKey = buildConversationKey(selected);
        if (selectedConversationKeyRef.current === selectedKey) {
          setMessages((previous) => {
            const next = upsertMessage(previous, fallbackMessage);
            return areMessagesEquivalent(previous, next) ? previous : next;
          });
        }

        if (selected.type === "TEAM") {
          setTeamConversations((previous) => updateConversationPreview(previous, fallbackMessage, false).next);
        } else {
          setHrConversations((previous) => updateConversationPreview(previous, fallbackMessage, false).next);
        }

        if (!created.id || !created.message?.trim()) {
          const refreshedThread = sortMessages(await listConversationMessages(selected.type, selected.id));
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
    [isAdminObserver, refreshConversations]
  );

  const openHrSupportConversation = useCallback(async (): Promise<ChatConversation> => {
    if (!canOpenHrSupport) {
      throw new Error("HR support chat is only available to employees.");
    }

    setError(null);
    const conversation = await createOrGetMyHrSupportConversation();
    if (!conversation.id) {
      throw new Error("Unable to open HR support.");
    }

    messageLoadVersionRef.current += 1;
    setHrConversations((previous) => placeConversationOnTop(previous, conversation));
    setSelectedConversationKey(buildConversationKey(conversation));
    setMessages([]);
    return conversation;
  }, [canOpenHrSupport]);

  const selectConversation = useCallback((conversation: Pick<ChatConversation, "id" | "type">) => {
    if (!conversation.id) return;
    const nextKey = buildConversationKey(conversation);
    if (nextKey === selectedConversationKeyRef.current) return;
    setSelectedConversationKey(nextKey);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    void refreshConversations();
  }, [currentUserId, refreshConversations]);

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
    if (!conversationSubKey) return;

    const refs = conversationSubKey
      .split(",")
      .filter(Boolean)
      .map((key) => {
        const [type, id] = key.split(":");
        return { id, type: type as ChatType };
      });
    if (refs.length === 0) return;

    const unsubscribe = subscribeChatRealtime(refs, (payload, message) => {
      const selected = selectedConversationRef.current;
      const selectedConversationHint = selected
        ? {
            id: selected.id,
            type: selected.type,
          }
        : null;
      const conversationHint = getRealtimeConversationHint(message) ?? selectedConversationHint;
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
  }, [conversationSubKey, handleIncomingMessage, scheduleSilentConversationRefresh]);

  // Polling fallback for realtime updates
  useEffect(() => {
    const selected = selectedConversationRef.current;

    if (!selected?.id) {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    pollingIntervalRef.current = window.setInterval(() => {
      if (!mountedRef.current) return;

      const selectedConversationSnapshot = selectedConversationRef.current;
      if (!selectedConversationSnapshot?.id) return;
      const selectedKey = buildConversationKey(selectedConversationSnapshot);
      if (selectedConversationKeyRef.current !== selectedKey) return;

      void (async () => {
        try {
          const latestMessages = sortMessages(
            await listConversationMessages(selectedConversationSnapshot.type, selectedConversationSnapshot.id)
          );

          if (!mountedRef.current) return;
          if (selectedConversationKeyRef.current !== selectedKey) return;

          const previousMessages = messagesRef.current;
          const previousIds = new Set(previousMessages.map((message) => message.id));
          const resolvedViewerId = viewerEmployeeIdRef.current;

          const newlyReceivedMessages = latestMessages.filter((message) => {
            if (previousIds.has(message.id)) return false;
            if (!resolvedViewerId) return true;
            return message.senderEmployeeId !== resolvedViewerId;
          });

          if (!areMessagesEquivalent(previousMessages, latestMessages)) {
            setMessages(latestMessages);
          }

          if (newlyReceivedMessages.length > 0) {
            void markSelectedConversationAsRead(selectedConversationSnapshot, newlyReceivedMessages);
          }

          const lastMessage = latestMessages[latestMessages.length - 1];
          if (lastMessage) {
            if (selectedConversationSnapshot.type === "TEAM") {
              setTeamConversations((previous) => updateConversationPreview(previous, lastMessage, false).next);
            } else {
              setHrConversations((previous) => updateConversationPreview(previous, lastMessage, false).next);
            }
          }
        } catch {
          // Silent polling failures should not block thread interaction.
        }
      })();
    }, 6000);

    return () => {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [markSelectedConversationAsRead, selectedConversation?.id, selectedConversation?.type]);

  // Poll for conversation list updates as realtime fallback
  useEffect(() => {
    const conversationPollInterval = window.setInterval(() => {
      if (!mountedRef.current) return;
      void refreshConversations({ silent: true });
    }, 15000);

    return () => {
      window.clearInterval(conversationPollInterval);
    };
  }, [refreshConversations]);

  return {
    currentEmployeeId: viewerEmployeeId,
    teamConversations,
    hrConversations,
    canOpenHrSupport,
    canSendSelectedConversation,
    selectedConversation,
    selectedConversationId: selectedConversation?.id ?? null,
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
  };
}
