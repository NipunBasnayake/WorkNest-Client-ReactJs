import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { tokenStorage } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";

export type RealtimeListener = (payload: unknown, message: IMessage) => void;

interface SubscriptionEntry {
  id: string;
  destinations: string[];
  listener: RealtimeListener;
  sockets: StompSubscription[];
}

function resolveBrokerUrl(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined;
  if (configured?.trim()) return configured.trim();

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";
  try {
    const url = new URL(apiBase);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}/ws`;
  } catch {
    return "ws://localhost:8080/ws";
  }
}

function parsePayload(message: IMessage): unknown {
  if (!message.body) return null;
  try {
    return unwrapApiData<unknown>(JSON.parse(message.body));
  } catch {
    return message.body;
  }
}

export function readRealtimeDestinations(envKey: string, fallback: string[]): string[] {
  const raw = import.meta.env[envKey] as string | undefined;
  if (!raw) return fallback;

  const parsed = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
}

class RealtimeStompClient {
  private client: Client | null = null;
  private entries = new Map<string, SubscriptionEntry>();
  private connected = false;

  subscribe(destinations: string[], listener: RealtimeListener): () => void {
    const normalizedDestinations = [...new Set(destinations.map((item) => item.trim()).filter(Boolean))];
    if (normalizedDestinations.length === 0) return () => {};

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const entry: SubscriptionEntry = {
      id,
      destinations: normalizedDestinations,
      listener,
      sockets: [],
    };

    this.entries.set(id, entry);
    this.ensureClient();
    if (this.connected) this.attach(entry);

    return () => {
      this.detach(entry);
      this.entries.delete(id);

      if (this.entries.size === 0) {
        this.connected = false;
        void this.client?.deactivate();
        this.client = null;
      }
    };
  }

  private ensureClient() {
    if (import.meta.env.VITE_REALTIME_DISABLED === "true") return;
    if (this.client) return;

    const client = new Client({
      brokerURL: resolveBrokerUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: () => {
        client.connectHeaders = this.getHeaders();
      },
    });

    client.onConnect = () => {
      this.connected = true;
      this.entries.forEach((entry) => {
        this.attach(entry);
      });
    };

    client.onWebSocketClose = () => {
      this.connected = false;
      this.entries.forEach((entry) => {
        entry.sockets = [];
      });
    };

    client.onStompError = (frame) => {
      // Keep silent in production, but useful when backend destinations differ by deployment.
      if (import.meta.env.DEV) {
        console.warn("WorkNest realtime STOMP error:", frame.headers["message"] ?? "Unknown STOMP error");
      }
    };

    this.client = client;
    client.activate();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const accessToken = tokenStorage.getAccess();
    const tenantKey = tokenStorage.getTenantKey();

    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (tenantKey) headers["X-Tenant-ID"] = tenantKey;

    return headers;
  }

  private attach(entry: SubscriptionEntry) {
    if (!this.client || !this.connected) return;
    if (entry.sockets.length > 0) return;

    entry.sockets = entry.destinations.map((destination) =>
      this.client!.subscribe(destination, (message) => {
        entry.listener(parsePayload(message), message);
      })
    );
  }

  private detach(entry: SubscriptionEntry) {
    entry.sockets.forEach((socket) => socket.unsubscribe());
    entry.sockets = [];
  }
}

const realtimeClient = new RealtimeStompClient();

export function subscribeRealtime(destinations: string[], listener: RealtimeListener): () => void {
  return realtimeClient.subscribe(destinations, listener);
}
