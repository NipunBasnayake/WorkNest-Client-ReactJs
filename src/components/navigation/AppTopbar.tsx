import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { NotificationItem } from "@/modules/notifications/components/NotificationItem";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeNotifications,
} from "@/modules/notifications/services/notificationService";
import type { AppNotification } from "@/modules/notifications/types";

interface AppTopbarProps {
  area: "tenant" | "platform";
  pageTitle: string;
  breadcrumb?: string[];
  onMobileMenuToggle: () => void;
}

export function AppTopbar({ area, pageTitle, breadcrumb, onMobileMenuToggle }: AppTopbarProps) {
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isTenantArea = area === "tenant";

  const refreshNotifications = useCallback(async () => {
    if (!isTenantArea) return;
    setLoading(true);
    try {
      const [list, unread] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);
      setItems(list);
      setUnreadCount(unread);
    } finally {
      setLoading(false);
    }
  }, [isTenantArea]);

  useEffect(() => {
    if (!isTenantArea) return;
    refreshNotifications();

    const unsubscribe = subscribeNotifications(() => {
      getNotifications().then(setItems).catch(() => undefined);
      getUnreadNotificationCount().then(setUnreadCount).catch(() => undefined);
    });

    return unsubscribe;
  }, [isTenantArea, refreshNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const previewItems = useMemo(() => items.slice(0, 5), [items]);

  async function handleMarkRead(id: string) {
    await markNotificationAsRead(id);
    const [list, unread] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);
    setItems(list);
    setUnreadCount(unread);
  }

  async function handleMarkAll() {
    await markAllNotificationsAsRead();
    const [list, unread] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);
    setItems(list);
    setUnreadCount(unread);
  }

  return (
    <header
      className="h-16 flex items-center gap-4 px-4 sm:px-6 border-b shrink-0 transition-colors duration-200"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor:     "var(--border-default)",
      }}
    >
      {/* Mobile menu trigger */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-lg cursor-pointer transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/20"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title + breadcrumb */}
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 mb-0.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span style={{ color: "var(--text-tertiary)" }} className="text-xs">/</span>
                )}
                <span
                  className="text-xs"
                  style={{ color: i < breadcrumb.length - 1 ? "var(--text-tertiary)" : "var(--text-secondary)" }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1
          className="text-base font-semibold truncate leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {isTenantArea && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="relative h-9 w-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/20"
              style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
              aria-label="Notifications"
            >
              <BellRing size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full px-1 text-[10px] font-semibold flex items-center justify-center"
                  style={{ backgroundColor: "#9332EA", color: "white" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-[350px] rounded-2xl border p-3 shadow-xl"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Notifications
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkAll}
                    disabled={unreadCount === 0}
                    className="text-xs font-semibold cursor-pointer disabled:opacity-50"
                    style={{ color: "var(--color-primary-600)" }}
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {loading && (
                    <div className="rounded-xl border p-4 text-xs text-center" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                      Loading notifications...
                    </div>
                  )}

                  {!loading && previewItems.length === 0 && (
                    <div className="rounded-xl border p-4 text-xs text-center" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                      No notifications yet.
                    </div>
                  )}

                  {!loading && previewItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      compact
                      onMarkRead={async (itemId) => {
                        await handleMarkRead(itemId);
                      }}
                    />
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    to="/app/notifications"
                    onClick={() => {
                      setOpen(false);
                    }}
                    className="text-xs font-semibold no-underline"
                    style={{ color: "var(--color-primary-600)" }}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <ThemeToggle />

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-default"
              style={{
                background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)",
              }}
              title={user.name}
            >
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
