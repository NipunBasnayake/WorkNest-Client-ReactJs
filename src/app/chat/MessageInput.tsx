import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { FileUploadField } from "@/components/common/FileUploadField";
import type { UploadedFileAsset } from "@/types";

interface MessageInputProps {
  disabled: boolean;
  disabledReason?: string;
  isSending: boolean;
  onSend: (text: string, attachments: UploadedFileAsset[]) => Promise<void>;
}

const MAX_TEXTAREA_HEIGHT = 164;

export function MessageInput({ disabled, disabledReason, isSending, onSend }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState<string>("");
  const [attachments, setAttachments] = useState<UploadedFileAsset[]>([]);

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
      await onSend(trimmedValue, attachments);
      setValue("");
      setAttachments([]);
    } catch {
      // Keep the unsent draft in the input when send fails.
    }
  }, [attachments, canSend, onSend, trimmedValue]);

  return (
    <div
      className="space-y-3 rounded-2xl border p-3"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <FileUploadField
        id="chat-attachments"
        label="Attachments"
        hint="Up to 5 private files for this message."
        folder="chat/attachments"
        category="CHAT_ATTACHMENT"
        kind="document"
        multiple
        disabled={disabled || isSending || attachments.length >= 5}
        value={attachments}
        onChange={(next) => setAttachments(next.slice(0, 5))}
      />

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
          placeholder={disabled ? (disabledReason ?? "Select a conversation to start typing") : "Type your message..."}
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
            background: "var(--brand-action)",
          }}
          aria-label="Send message"
        >
          <SendHorizontal size={16} />
        </button>
      </div>

      <p className="mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {disabled && disabledReason ? disabledReason : "Press Enter to send, Shift+Enter for a new line."}
      </p>
    </div>
  );
}
