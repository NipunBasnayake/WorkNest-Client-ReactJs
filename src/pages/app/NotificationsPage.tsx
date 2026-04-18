import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { isAnnouncementLinkedNotification, type AppNotification } from "@/modules/notifications/types";
import { getErrorMessage } from "@/utils/errorHandler";

type NotificationFilter = "all" | "unread";

export function NotificationsPage() {
  usePageMeta({ title: "Notifications", breadcrumb: ["Workspace", "Notifications"] });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const fetchInFlightRef = useRef(false);
  const refetchQueuedRef = useRef(false);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (fetchInFlightRef.current) {
      refetchQueuedRef.current = true;
      return;
    }

    fetchInFlightRef.current = true;
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to load notifications."));
    } finally {
      fetchInFlightRef.current = false;
      if (!silent) {
        setLoading(false);
      }

      if (refetchQueuedRef.current) {
        refetchQueuedRef.current = false;
        void fetchNotifications(true);
      }
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const unsubscribe = subscribeNotifications(() => {
      void fetchNotifications(true);
    });
    return unsubscribe;
  }, [fetchNotifications]);

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.read);
    }
    return notifications;
  }, [filter, notifications]);

  async function handleMarkRead(id: string) {
    setActionError(null);
    const previous = notifications;
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));

    try {
      await markNotificationAsRead(id);
      void fetchNotifications(true);
    } catch (err: unknown) {
      setNotifications(previous);
      setActionError(getErrorMessage(err, "Unable to mark notification as read."));
    }
  }

  async function handleMarkAll() {
    setActionError(null);
    const previous = notifications;
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    try {
      await markAllNotificationsAsRead();
      void fetchNotifications(true);
    } catch (err: unknown) {
      setNotifications(previous);
      setActionError(getErrorMessage(err, "Unable to mark all notifications as read."));
    }
  }

  async function handleOpenNotification(item: AppNotification) {
    if (item.read) return;
    if (!isAnnouncementLinkedNotification(item)) return;

    setNotifications((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)));
    try {
      await markNotificationAsRead(item.id);
    } catch {
      void fetchNotifications(true);
    }
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
      {actionError && <ErrorBanner message={actionError} />}

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
            <NotificationItem key={item.id} item={item} onMarkRead={handleMarkRead} onOpen={handleOpenNotification} />
          ))}
        </div>
      )}
    </div>
  );
}
