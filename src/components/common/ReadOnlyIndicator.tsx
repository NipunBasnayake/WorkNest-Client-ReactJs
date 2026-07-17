import { LockKeyhole } from "lucide-react";

interface ReadOnlyIndicatorProps {
  message: string;
}

export function ReadOnlyIndicator({ message }: ReadOnlyIndicatorProps) {
  return (
    <span
      className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg"
      style={{
        color: "var(--text-secondary)",
        backgroundColor: "var(--bg-muted)",
      }}
      title={message}
      aria-label={message}
    >
      <LockKeyhole size={15} aria-hidden="true" />
    </span>
  );
}
