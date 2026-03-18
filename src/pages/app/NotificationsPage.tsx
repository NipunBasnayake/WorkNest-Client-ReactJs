import { useEffect, useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { NotificationItem } from "@/modules/notifications/components/NotificationItem";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeNotifications,
} from "@/modules/notifications/services/notificationService";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { AppNotification } from "@/modules/notifications/types";

type NotificationFilter = "all" | "unread";

export function NotificationsPage() {
  usePageMeta({ title: "Notifications", breadcrumb: ["Workspace", "Notifications"] });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const unsubscribe = subscribeNotifications(() => {
      getNotifications().then(setNotifications).catch(() => undefined);
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.read);
    }
    return notifications;
  }, [filter, notifications]);

  async function handleMarkRead(id: string) {
    await markNotificationAsRead(id);
    const latest = await getNotifications();
    setNotifications(latest);
  }

  async function handleMarkAll() {
    await markAllNotificationsAsRead();
    const latest = await getNotifications();
    setNotifications(latest);
  }

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
        actions={(
          <Button variant="outline" onClick={handleMarkAll} disabled={notifications.length === 0 || unreadCount === 0}>
            Mark all as read
          </Button>
        )}
      />

      <SectionCard>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer"
            style={{
              background: filter === "all" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
              color: filter === "all" ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className="rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer"
            style={{
              background: filter === "unread" ? "rgba(147,50,234,0.14)" : "var(--bg-muted)",
              color: filter === "unread" ? "var(--color-primary-600)" : "var(--text-secondary)",
            }}
          >
            Unread
          </button>
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={fetchNotifications} />}

      {loading && (
        <SectionCard>
          <div className="h-56 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<BellRing size={26} />}
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description={filter === "unread" ? "You are all caught up." : "Task, leave, and announcement updates will appear here."}
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <NotificationItem key={item.id} item={item} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
}
