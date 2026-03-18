import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

interface MessageInputProps {
  disabled: boolean;
  isSending: boolean;
  onSend: (text: string) => Promise<void>;
}

const MAX_TEXTAREA_HEIGHT = 164;

export function MessageInput({ disabled, isSending, onSend }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState<string>("");

  const trimmedValue = useMemo(() => value.trim(), [value]);
  const canSend = !disabled && !isSending && trimmedValue.length > 0;

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${Math.max(44, nextHeight)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [resizeTextarea, value]);

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    try {
      await onSend(trimmedValue);
      setValue("");
    } catch {
      // Keep the unsent draft in the input when send fails.
    }
  }, [canSend, onSend, trimmedValue]);

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
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder={disabled ? "Select a conversation to start typing" : "Type your message..."}
          disabled={disabled || isSending}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm leading-5 outline-none transition-all focus:ring-2 focus:ring-primary-500/35 disabled:opacity-60"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
          aria-label="Message composer"
        />

        <button
          type="button"
          onClick={() => {
            void handleSend();
          }}
          disabled={!canSend}
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #9332EA 0%, #7C1FD1 100%)",
          }}
          aria-label="Send message"
        >
          <SendHorizontal size={16} />
        </button>
      </div>

      <p className="mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Press Enter to send, Shift+Enter for a new line.
      </p>
    </div>
  );
}
