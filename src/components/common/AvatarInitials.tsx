import { FaUser } from "react-icons/fa6";

interface AvatarInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
  src?: string;
}

const SIZE_CLASS: Record<NonNullable<AvatarInitialsProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function AvatarInitials({ name, size = "md", src }: AvatarInitialsProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${SIZE_CLASS[size]} shrink-0 rounded-full object-cover`}
        title={name}
      />
    );
  }

  return (
    <div
      className={`${SIZE_CLASS[size]} shrink-0 rounded-full flex items-center justify-center text-white`}
      style={{ backgroundColor: "#6b7280" }}
      title={name}
    >
      <FaUser size={size === "lg" ? 20 : size === "md" ? 14 : 12} />
    </div>
  );
}
