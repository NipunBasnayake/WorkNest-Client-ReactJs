import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import type { AppNotification } from "@/modules/notifications/types";

interface NotificationItemProps {
  item: AppNotification;
  compact?: boolean;
  onMarkRead?: (id: string) => void;
  onOpen?: (item: AppNotification) => void;
}

export function NotificationItem({ item, compact = false, onMarkRead, onOpen }: NotificationItemProps) {
  const content = (
    <div
      className={`rounded-xl border p-3 transition-colors ${item.read ? "" : "shadow-sm"} ${
        compact ? "hover:bg-primary-50/40 dark:hover:bg-primary-950/15" : "hover:bg-primary-50/30 dark:hover:bg-primary-950/10"
      }`}
      style={{
        backgroundColor: item.read ? "var(--bg-surface)" : "rgba(147,50,234,0.06)",
        borderColor: item.read ? "var(--border-default)" : "rgba(147,50,234,0.2)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="mt-0.5 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-500)" }}
        >
          <BellRing size={14} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {item.title}
            </p>
            {!item.read && (
              <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--color-primary-500)" }} />
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {item.message}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {formatDateTime(item.createdAt)}
            </span>
            {!item.read && onMarkRead && (
              <button
                type="button"
                className="text-[11px] font-semibold cursor-pointer"
                style={{ color: "var(--color-primary-600)" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkRead(item.id);
                }}
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (item.link) {
    return (
      <Link
        to={item.link}
        className="block no-underline"
        onClick={() => {
          onOpen?.(item);
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
