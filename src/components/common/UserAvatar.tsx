import { useState } from "react";
import { UserRound } from "lucide-react";
import { useProtectedFileUrl } from "@/hooks/useProtectedFileUrl";

export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: UserAvatarSize;
  className?: string;
  status?: "online" | "offline" | "busy";
  eager?: boolean;
}

const SIZE_CLASS: Record<UserAvatarSize, string> = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl sm:h-24 sm:w-24",
};

const ICON_SIZE: Record<UserAvatarSize, number> = { xs: 12, sm: 14, md: 18, lg: 22, xl: 32 };

const STATUS_CLASS = {
  online: "bg-success-500",
  offline: "bg-surface-400",
  busy: "bg-danger-500",
};

function getUserInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  name,
  email,
  src,
  size = "md",
  className = "",
  status,
  eager = false,
}: UserAvatarProps) {
  const resolvedSource = useProtectedFileUrl(src);
  const [brokenSource, setBrokenSource] = useState<string | null>(null);
  const initials = getUserInitials(name, email);
  const label = name?.trim() || email?.trim() || "User";

  const broken = Boolean(resolvedSource && brokenSource === resolvedSource);

  return (
    <span
      className={`relative inline-flex shrink-0 ${SIZE_CLASS[size]} ${className}`}
      title={label}
      aria-label={label}
    >
      {resolvedSource && !broken ? (
        <img
          src={resolvedSource}
          alt={label}
          className="h-full w-full rounded-full object-cover ring-1 ring-black/5"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setBrokenSource(resolvedSource)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950 dark:text-primary-200 dark:ring-primary-800">
          {initials || <UserRound size={ICON_SIZE[size]} aria-hidden="true" />}
        </span>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 h-[28%] w-[28%] rounded-full border-2 border-[var(--bg-surface)] ${STATUS_CLASS[status]}`}
          aria-label={status}
        />
      )}
    </span>
  );
}
