import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { tokenStorage } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";

export type RealtimeListener = (payload: unknown, message: IMessage) => void;

interface SubscriptionEntry {
  id: string;
  destinations: string[];
  listener: RealtimeListener;
  sockets: StompSubscription[];
}

function resolveHttpWsUrl(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined;
  if (configured?.trim()) {
    return configured.trim().replace(/^ws(s)?:\/\//, (_, ssl) => ssl ? "https://" : "http://");
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";
  return `${apiBase}/ws`;
}

function parsePayload(message: IMessage): unknown {
  if (!message.body) return null;
  try {
    return unwrapApiData<unknown>(JSON.parse(message.body));
  } catch {
    return message.body;
  }
}

function extractTenantFromDestination(destination: string): string | null {
  const match = destination.match(/^\/(?:topic|app)\/tenant\/([^/]+)(?:\/|$)/);
  return match?.[1] ?? null;
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

/**
 * Configuration for the realtime STOMP client.
 */
interface RealtimeStompConfig {
  /** Initial reconnect delay in ms (doubles on each failure). */
  initialReconnectDelay: number;
  /** Maximum reconnect delay cap in ms. */
  maxReconnectDelay: number;
  /** Maximum reconnection attempts before giving up (-1 = unlimited). */
  maxReconnectAttempts: number;
  /** Heartbeat interval in ms for incoming frames. */
  heartbeatIncoming: number;
  /** Heartbeat interval in ms for outgoing frames. */
  heartbeatOutgoing: number;
}

const DEFAULT_CONFIG: RealtimeStompConfig = {
  initialReconnectDelay: 1_000,
  maxReconnectDelay: 30_000,
  maxReconnectAttempts: 10,
  heartbeatIncoming: 10_000,
  heartbeatOutgoing: 10_000,
};

class RealtimeStompClient {
  private client: Client | null = null;
  private entries = new Map<string, SubscriptionEntry>();
  private connected = false;
  private destroyed = false;
  private reconnectAttempts = 0;
  private config: RealtimeStompConfig;

  constructor(config: Partial<RealtimeStompConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  subscribe(destinations: string[], listener: RealtimeListener): () => void {
    const normalizedDestinations = this.normalizeDestinations(destinations);
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

    let cleanedUp = false;
    return () => {
      if (cleanedUp) return;
      cleanedUp = true;

      this.detach(entry);
      this.entries.delete(id);

      if (this.entries.size === 0) {
        this.resetClient({ deactivate: true });
      }
    };
  }

  private ensureClient() {
    if (import.meta.env.VITE_REALTIME_DISABLED === "true") return;
    if (this.client) return;
    if (!this.hasConnectContext()) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(resolveHttpWsUrl()),
      reconnectDelay: this.computeDelay(),
      heartbeatIncoming: this.config.heartbeatIncoming,
      heartbeatOutgoing: this.config.heartbeatOutgoing,
      beforeConnect: () => {
        if (!this.hasConnectContext()) {
          this.connected = false;
          this.destroyed = true;
          void client.deactivate();
          return;
        }
        client.connectHeaders = this.getHeaders();
      },
    });

    client.onConnect = () => {
      if (this.client !== client) return;
      this.connected = true;
      this.reconnectAttempts = 0;
      this.destroyed = false;
      this.entries.forEach((entry) => {
        if (entry.sockets.length === 0) {
          this.attach(entry);
        }
      });
    };

    client.onWebSocketClose = () => {
      if (this.client !== client) return;
      this.connected = false;
      this.entries.forEach((entry) => {
        entry.sockets = [];
      });
      if (!this.hasConnectContext()) {
        this.resetClient({ deactivate: true });
        return;
      }
      // Drive exponential backoff — this.reconnectAttempts is read by computeDelay()
      if (!this.destroyed && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnectAttempts += 1;
      }
    };

    client.onStompError = (frame) => {
      /*
       * Server sent a STOMP ERROR frame (e.g., invalid auth, bad
       * subscription destination).  Log the error and stop reconnecting
       * by deactivating the client.  Without this, the client keeps
       * reconnecting in an infinite loop on auth failures.
       */
      const msg = frame.headers["message"] ?? "Unknown STOMP error";
      if (import.meta.env.DEV) {
        console.warn("WorkNest realtime STOMP error:", msg);
      }
      console.error(`[WS] STOMP error: ${msg}`);
      this.resetClient({ deactivate: true });
    };

    this.client = client;
    client.activate();
  }

  /**
   * Exponential backoff: starts at initialReconnectDelay and doubles up to maxReconnectDelay.
   * Adds jitter (± 20%) to prevent thundering herd on reconnect.
   */
  private computeDelay(): number {
    if (this.reconnectAttempts === 0) return this.config.initialReconnectDelay;

    const exponential = Math.min(
      this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    // Add ±20% jitter
    const jitter = 0.8 + Math.random() * 0.4;
    return Math.round(exponential * jitter);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const accessToken = tokenStorage.getAccess();
    const tenantKey = tokenStorage.getTenantKey();
    const csrfToken = tokenStorage.getCsrf();

    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (tenantKey) {
      headers["X-Tenant-ID"] = tenantKey;
      headers["X-Tenant-Slug"] = tenantKey;
    }
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
      headers["X-CSRF-TOKEN"] = csrfToken;
    }

    return headers;
  }

  private hasConnectContext(): boolean {
    return Boolean(tokenStorage.getAccess() && tokenStorage.getTenantKey());
  }

  private normalizeDestinations(destinations: string[]): string[] {
    const tenantKey = tokenStorage.getTenantKey();
    const normalizedTenantKey = tenantKey?.trim().toLowerCase();

    return [...new Set(destinations.map((item) => item.trim()).filter(Boolean))]
      .filter((destination) => {
        const destinationTenant = extractTenantFromDestination(destination);
        if (!destinationTenant) return true;

        const matchesTenant = Boolean(normalizedTenantKey && destinationTenant.toLowerCase() === normalizedTenantKey);
        if (!matchesTenant && import.meta.env.DEV) {
          console.warn(`Skipping realtime destination outside current tenant: ${destination}`);
        }
        return matchesTenant;
      });
  }

  private attach(entry: SubscriptionEntry) {
    if (!this.client || !this.connected) return;
    if (entry.sockets.length > 0) return;

    const sockets: StompSubscription[] = [];
    entry.destinations.forEach((destination) => {
      try {
        const socket = this.client!.subscribe(destination, (message) => {
          try {
            entry.listener(parsePayload(message), message);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn("WorkNest realtime listener failed:", error);
            }
          }
        });
        sockets.push(socket);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(`Unable to subscribe to realtime destination ${destination}:`, error);
        }
      }
    });
    entry.sockets = sockets;
  }

  private detach(entry: SubscriptionEntry) {
    entry.sockets.forEach((socket) => {
      try {
        socket.unsubscribe();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("Unable to unsubscribe from realtime destination:", error);
        }
      }
    });
    entry.sockets = [];
  }

  private resetClient(options: { deactivate: boolean }) {
    const client = this.client;
    this.connected = false;
    this.destroyed = true;
    this.reconnectAttempts = 0;
    this.entries.forEach((entry) => {
      entry.sockets = [];
    });
    this.client = null;

    if (client && options.deactivate) {
      void client.deactivate().catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("Unable to deactivate realtime client:", error);
        }
      });
    }
  }
}

const realtimeClient = new RealtimeStompClient();

export function subscribeRealtime(destinations: string[], listener: RealtimeListener): () => void {
  return realtimeClient.subscribe(destinations, listener);
}
