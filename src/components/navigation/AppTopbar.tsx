import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing, ChevronDown, LogOut, Menu, Moon, Settings, Shield, Sun, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { NotificationItem } from "@/modules/notifications/components/NotificationItem";
import { authRoutes, platformRoutes, tenantRoutes } from "@/utils/tenantRoutes";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeNotifications,
} from "@/modules/notifications/services/notificationService";
import { isAnnouncementLinkedNotification, type AppNotification } from "@/modules/notifications/types";
import { buildBreadcrumbItems } from "@/components/navigation/breadcrumbs";

interface AppTopbarProps {
  area: "tenant" | "platform";
  pageTitle: string;
  breadcrumb?: string[];
  onMobileMenuToggle: () => void;
}

function formatRoleLabel(role?: string | null): string {
  if (!role) return "Workspace";
  return role
    .replace(/^ROLE_/, "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function AppTopbar({ area, pageTitle, breadcrumb, onMobileMenuToggle }: AppTopbarProps) {
  const { user, logout, role, tenantKey } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const isTenantArea = area === "tenant";
  const notificationPanelId = "topbar-notifications-panel";
  const displayName = user?.name?.trim() || user?.email || (isTenantArea ? "Workspace user" : "WorkNest user");
  const displayEmail = user?.email || "No email available";
  const roleLabel = formatRoleLabel(role ?? user?.role);
  const tenantSlug = tenantKey ?? undefined;
  const avatarUrl = user?.avatarUrl;

  const refreshNotifications = useCallback(async () => {
    if (!isTenantArea) return;
    setLoading(true);
    setNotificationError(null);
    try {
      const [list, unread] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);
      setItems(list);
      setUnreadCount(unread);
    } catch {
      setNotificationError("Unable to load notifications.");
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

  useEffect(() => {
    if (!open) return;

    notificationPanelRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      notificationButtonRef.current?.focus({ preventScroll: true });
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const previewItems = useMemo(() => items.slice(0, 5), [items]);
  const breadcrumbItems = useMemo(() => buildBreadcrumbItems({
    area,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    labels: breadcrumb,
    tenantSlug,
  }), [area, breadcrumb, location.hash, location.pathname, location.search, tenantSlug]);

  async function handleLogout() {
    await logout();
    navigate(authRoutes.login);
  }

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

  async function handleOpenNotification(item: AppNotification) {
    if (item.read) return;
    if (!isAnnouncementLinkedNotification(item)) return;

    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(item.id);
    } catch {
      const [list, unread] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);
      setItems(list);
      setUnreadCount(unread);
    }
  }

  return (
    <header
      className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center gap-4 border-b px-4 transition-colors duration-200 sm:px-6"
      style={{
        backgroundColor: "var(--bg-navbar)",
        borderColor: "var(--border-default)",
        backdropFilter: "var(--navbar-blur)",
        boxShadow: "var(--shadow-sm)",
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
        {breadcrumbItems.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1 hidden items-center gap-1.5 sm:flex">
            {breadcrumbItems.map((item, i) => (
              <span key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden="true" style={{ color: "var(--text-tertiary)" }} className="text-xs">/</span>
                )}
                <Link
                  to={item.to}
                  aria-current={item.current ? "page" : undefined}
                  className={`truncate text-[11px] uppercase tracking-[0.18em] no-underline transition-colors hover:text-primary-600 ${item.current ? "font-bold" : "font-medium"}`}
                  style={{ color: item.current ? "var(--color-primary-600)" : "var(--text-tertiary)" }}
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
        <h1
          className="truncate text-sm font-semibold leading-tight sm:text-base"
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
              ref={notificationButtonRef}
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/20"
              style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? notificationPanelId : undefined}
            >
              <BellRing size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full px-1 text-[10px] font-semibold flex items-center justify-center"
                  style={{ backgroundColor: "var(--brand-action)", color: "var(--brand-on-primary)" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div
                ref={notificationPanelRef}
                id={notificationPanelId}
                role="dialog"
                aria-label="Notifications"
                tabIndex={-1}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-[22rem] rounded-2xl border p-3 shadow-xl outline-none sm:w-[350px]"
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

                <div className="max-h-[70vh] space-y-2 overflow-y-auto sm:max-h-[320px]">
                  {loading && (
                    <div className="rounded-xl border p-4 text-xs text-center" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                      Loading notifications...
                    </div>
                  )}

                  {!loading && notificationError && (
                    <div className="rounded-xl border p-4 text-xs text-center" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                      {notificationError}
                    </div>
                  )}

                  {!loading && !notificationError && previewItems.length === 0 && (
                    <div className="rounded-xl border p-4 text-xs text-center" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                      No notifications yet.
                    </div>
                  )}

                  {!loading && !notificationError && previewItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onOpen={handleOpenNotification}
                      compact
                      onMarkRead={async (itemId) => {
                        await handleMarkRead(itemId);
                      }}
                    />
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    to={tenantRoutes.notifications()}
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

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group inline-flex h-9 items-center gap-2 rounded-xl border px-1.5 pr-2 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/20"
                style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                aria-label="Open user menu"
              >
                <UserAvatar name={displayName} email={displayEmail} src={avatarUrl} size="xs" eager />
                <ChevronDown size={14} className="hidden text-inherit opacity-60 transition-transform group-data-[state=open]:rotate-180 sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-72 p-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]">
              <div className="flex items-start gap-3 px-2 py-2.5">
                <UserAvatar name={displayName} email={displayEmail} src={avatarUrl} size="md" eager />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-5" style={{ color: "var(--text-primary)" }}>
                    {displayName}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {displayEmail}
                  </p>
                  <span
                    className="mt-2 inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      borderColor: "color-mix(in srgb, var(--brand-action) 28%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--brand-action) 10%, transparent)",
                      color: "var(--color-primary-600)",
                    }}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>

              <Separator className="my-1 bg-[var(--border-default)]" decorative />

              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => navigate(isTenantArea ? tenantRoutes.profile(tenantSlug) : platformRoutes.profile())}>
                  <User size={16} />
                  My Profile
                </DropdownMenuItem>
                {isTenantArea && (
                  <DropdownMenuItem onSelect={() => navigate(tenantRoutes.settingsProfile(tenantSlug))}>
                    <Settings size={16} />
                    Account Settings
                  </DropdownMenuItem>
                )}
                {isTenantArea && (
                  <DropdownMenuItem onSelect={() => navigate(tenantRoutes.settingsSecurity(tenantSlug))}>
                    <Shield size={16} />
                    Change Password
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => toggleTheme()}>
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                  Appearance / Theme
                </DropdownMenuItem>
                {isTenantArea && (
                  <DropdownMenuItem onSelect={() => navigate(tenantRoutes.settingsPreferences(tenantSlug))}>
                    <Bell size={16} />
                    Notification Preferences
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  void handleLogout();
                }}
                className="text-danger-600 focus:bg-danger-50 focus:text-danger-700 dark:text-danger-300 dark:focus:bg-danger-900/30 dark:focus:text-danger-200"
              >
                <LogOut size={16} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
