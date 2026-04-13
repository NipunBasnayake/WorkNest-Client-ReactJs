import { readRealtimeDestinations, subscribeRealtime, type RealtimeListener } from "@/services/realtime/stompService";
import { tokenStorage } from "@/services/http/client";

const TASKS_REALTIME_DESTINATIONS = readRealtimeDestinations("VITE_TASKS_TOPICS", [
  "/topic/tenant/tasks",
  "/topic/tasks",
]);

export function subscribeTaskRealtime(listener: RealtimeListener): () => void {
  const tenantKey = tokenStorage.getTenantKey();
  const scopedDestinations = tenantKey ? [`/topic/tenant/${tenantKey}/tasks`] : [];
  return subscribeRealtime([...new Set([...TASKS_REALTIME_DESTINATIONS, ...scopedDestinations])], listener);
}
