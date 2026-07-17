import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeNotifications,
} from "@/modules/notifications/services/notificationService";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Pagination } from "@/components/common/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { isAnnouncementLinkedNotification, type AppNotification } from "@/modules/notifications/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { Badge } from "@/components/common/Badge";

type NotificationFilter = "all" | "unread";

export function NotificationsPage() {
  usePageMeta({ title: "Notifications", breadcrumb: ["Workspace", "Notifications"] });
  const queryClient = useQueryClient();

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
  const notificationPagination = useClientPagination(filtered, {
    storageKey: "notifications",
    resetKey: filter,
  });

  async function handleMarkRead(id: string) {
    setActionError(null);
    const previous = notifications;
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));

    try {
      await markNotificationAsRead(id);
      await invalidateWorkflowQueries(queryClient, ["notifications"]);
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
      await invalidateWorkflowQueries(queryClient, ["notifications"]);
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
      await invalidateWorkflowQueries(queryClient, ["notifications"]);
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

      <SectionCard variant="table" title="Notification Center" subtitle="Operational updates organized by type, status, and date.">
        <div className="overflow-x-auto">
          <table className="worknest-data-table w-full min-w-[880px] text-left text-sm">
            <thead style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}>
              <tr>
                <th className="px-5 py-3 font-semibold">Notification</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}><td colSpan={5}><SkeletonRow cols={5} /></td></tr>
              ))}
              {!loading && notificationPagination.paginatedItems.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-primary-500/[0.03]" style={{ backgroundColor: item.read ? undefined : "rgba(147,50,234,0.035)" }}>
                  <td className="max-w-lg px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(147,50,234,0.1)", color: "var(--color-primary-600)" }}><BellRing size={14} /></span>
                      {item.link ? (
                        <Link to={item.link} onClick={() => void handleOpenNotification(item)} className="min-w-0 no-underline hover:opacity-80">
                          <span className="block truncate font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</span>
                          <span className="mt-1 block line-clamp-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{item.message}</span>
                        </Link>
                      ) : (
                        <div className="min-w-0">
                          <span className="block truncate font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</span>
                          <span className="mt-1 block line-clamp-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{item.message}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant="neutral">{formatType(item.type)}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={item.read ? "neutral" : "info"} showDot>{item.read ? "Read" : "Unread"}</Badge></td>
                  <td className="whitespace-nowrap px-5 py-4" style={{ color: "var(--text-secondary)" }}>{formatDateTime(item.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {item.link && <Link to={item.link} onClick={() => void handleOpenNotification(item)} title="Open notification" aria-label="Open notification" className="rounded-lg p-2 transition-colors hover:bg-primary-500/10" style={{ color: "var(--text-secondary)" }}><ExternalLink size={15} /></Link>}
                      {!item.read && <button type="button" onClick={() => void handleMarkRead(item.id)} title="Mark as read" aria-label="Mark notification as read" className="rounded-lg p-2 transition-colors hover:bg-primary-500/10" style={{ color: "var(--color-primary-600)" }}><Check size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !error && filtered.length === 0 && (
            <div className="p-8"><EmptyState icon={<BellRing size={26} />} title={filter === "unread" ? "No unread notifications" : "No notifications yet"} description={filter === "unread" ? "You are all caught up." : "Task, leave, and announcement updates will appear here."} /></div>
          )}
        </div>
        {!loading && !error && filtered.length > 0 && (
          <Pagination currentPage={notificationPagination.currentPage} totalItems={filtered.length} pageSize={notificationPagination.pageSize} onPageChange={notificationPagination.setCurrentPage} onPageSizeChange={notificationPagination.setPageSize} itemLabel="notifications" />
        )}
      </SectionCard>
    </div>
  );
}

function formatType(value: string): string {
  if (value.toUpperCase() === "ANNOUNCEMENT") return "Announcement update";
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
