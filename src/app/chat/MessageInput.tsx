import { useCallback, useState } from "react";
import { SendHorizontal } from "lucide-react";

interface MessageInputProps {
  disabled: boolean;
  isSending: boolean;
  onSend: (text: string) => Promise<void>;
}

export function MessageInput({ disabled, isSending, onSend }: MessageInputProps) {
  const [value, setValue] = useState<string>("");

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;

    try {
      await onSend(trimmed);
      setValue("");
    } catch {
      // Keep the unsent draft in the input when send fails.
    }
  }, [disabled, isSending, onSend, value]);

  return (
    <div
      className="rounded-2xl border p-3"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder={disabled ? "Select a conversation" : "Type your message"}
          disabled={disabled || isSending}
          className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/35 disabled:opacity-60"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
        />

        <button
          type="button"
          onClick={() => {
            void handleSend();
          }}
          disabled={disabled || isSending || !value.trim()}
          className="h-10 w-10 rounded-xl flex items-center justify-center text-white cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
          }}
          aria-label="Send message"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}

