interface AvatarInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS: Record<NonNullable<AvatarInitialsProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function AvatarInitials({ name, size = "md" }: AvatarInitialsProps) {
  return (
    <div
      className={`${SIZE_CLASS[size]} shrink-0 rounded-full flex items-center justify-center font-bold text-white`}
      style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
