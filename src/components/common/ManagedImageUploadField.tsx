import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { Camera, ImagePlus, LoaderCircle, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_SIDE = 4096;
const MAX_IMAGE_PIXELS = 25_000_000;

interface PendingImage {
  file: File;
  url: string;
  width?: number;
  height?: number;
}

interface ManagedImageUploadFieldProps {
  title: string;
  description: string;
  preview: ReactNode;
  previewAlt: string;
  hasImage: boolean;
  kind: "avatar" | "logo";
  uploadLabel: string;
  replaceLabel: string;
  onUpload: (file: File, options: ImageUploadRequestOptions) => Promise<void>;
  onRemove: () => Promise<void>;
  disabled?: boolean;
}

export function ManagedImageUploadField({
  title,
  description,
  preview,
  previewAlt,
  hasImage,
  kind,
  uploadLabel,
  replaceLabel,
  onUpload,
  onRemove,
  disabled = false,
}: ManagedImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const uploadController = useRef<AbortController | null>(null);
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [working, setWorking] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    uploadController.current?.abort();
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  useEffect(() => {
    if (!reviewing) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !working) {
        setReviewing(false);
        setPending((current) => {
          if (current) {
            URL.revokeObjectURL(current.url);
            objectUrls.current.delete(current.url);
          }
          return null;
        });
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [reviewing, working]);

  function releasePending() {
    if (pending) {
      URL.revokeObjectURL(pending.url);
      objectUrls.current.delete(pending.url);
    }
    setPending(null);
  }

  async function prepareFile(file: File) {
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Images must be 2 MB or smaller.");
      return;
    }

    let width: number | undefined;
    let height: number | undefined;
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
        bitmap.close();
      } catch {
        setError("This image cannot be decoded. Choose a different file.");
        return;
      }
      if (width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width * height > MAX_IMAGE_PIXELS) {
        setError("Image dimensions must be within 4096px and 25 megapixels.");
        return;
      }
    }

    releasePending();
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    setPending({ file, url, width, height });
    setReviewing(true);
  }

  async function startUpload() {
    if (!pending || working || disabled) return;
    setReviewing(false);
    setWorking(true);
    setProgress(0);
    setError(null);
    const controller = new AbortController();
    uploadController.current = controller;
    try {
      await onUpload(pending.file, {
        signal: controller.signal,
        onProgress: (value) => setProgress(Math.max(0, Math.min(100, value))),
      });
      setProgress(100);
      releasePending();
    } catch (uploadError) {
      if (controller.signal.aborted) {
        setError("Upload cancelled. Your previous image is still active.");
      } else {
        setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the image.");
      }
    } finally {
      if (uploadController.current === controller) uploadController.current = null;
      setWorking(false);
    }
  }

  async function handleRemove() {
    if (removing || working || disabled) return;
    setRemoving(true);
    setError(null);
    try {
      await onRemove();
      releasePending();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove the image.");
    } finally {
      setRemoving(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled || working || removing) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void prepareFile(file);
  }

  const localPreview = pending ? (
    <img
      src={pending.url}
      alt={previewAlt}
      className={`h-full w-full ${kind === "avatar" ? "object-cover" : "object-contain"}`}
    />
  ) : preview;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{title}</p>
        <p id={`${kind}-upload-help`} className="mt-1 text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>{description}</p>
      </div>

      <div
        className={`rounded-2xl border p-4 transition-colors ${dragging ? "ring-2 ring-primary-500/30" : ""}`}
        style={{
          borderColor: dragging ? "var(--brand-action)" : "var(--border-default)",
          background: dragging ? "var(--brand-soft)" : "var(--bg-muted)",
        }}
        onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={kind === "avatar"
              ? "h-24 w-24 shrink-0 overflow-hidden rounded-full border"
              : "flex h-20 min-w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-2"}
            style={{ borderColor: "var(--border-default)", backgroundColor: kind === "avatar" ? "var(--bg-surface)" : undefined }}
          >
            {localPreview}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {dragging ? "Drop the image to review it" : "Drag and drop an image here"}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>or choose a file from your device</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={disabled || working || removing}
                onClick={() => inputRef.current?.click()}
              >
                {kind === "avatar" ? <Camera size={15} /> : <ImagePlus size={15} />}
                {hasImage ? replaceLabel : uploadLabel}
              </Button>
              {hasImage ? (
                <Button type="button" variant="outline" size="sm" loading={removing} disabled={disabled || working} onClick={() => void handleRemove()}>
                  <Trash2 size={15} /> Remove
                </Button>
              ) : null}
              {pending && error && !working ? (
                <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => void startUpload()}>
                  <RefreshCw size={15} /> Retry
                </Button>
              ) : null}
              {working ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => uploadController.current?.abort()}>
                  <X size={15} /> Cancel
                </Button>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".png,.jpg,.jpeg,.webp"
              aria-describedby={`${kind}-upload-help`}
              disabled={disabled || working || removing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void prepareFile(file);
              }}
            />
          </div>
        </div>

        {working ? (
          <div className="mt-4" aria-live="polite">
            <div className="mb-1.5 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="inline-flex items-center gap-1.5"><LoaderCircle size={13} className="animate-spin" /> Uploading and processing</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border-default)" }}>
              <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.max(progress, 6)}%`, background: "var(--brand-action)" }} />
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-500" role="alert">{error}</p> : null}

      {reviewing && pending ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${kind}-image-review-title`}
            aria-describedby={`${kind}-image-review-description`}
            className="w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
              const first = buttons[0];
              const last = buttons.at(-1);
              if (!first || !last) return;
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <div className="border-b px-5 py-4" style={{ borderColor: "var(--border-default)" }}>
              <h3 id={`${kind}-image-review-title`} className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Review {kind === "avatar" ? "profile picture" : "company logo"}
              </h3>
              <p id={`${kind}-image-review-description`} className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {kind === "avatar" ? "The center square is used across WorkNest." : "The full logo is preserved inside each generated size."}
              </p>
            </div>
            <div className="p-5">
              <div className={kind === "avatar" ? "mx-auto aspect-square max-w-72 overflow-hidden rounded-2xl border" : "flex h-48 items-center justify-center overflow-hidden rounded-2xl border bg-white p-5"} style={{ borderColor: "var(--border-default)" }}>
                <img src={pending.url} alt={previewAlt} className={`h-full w-full ${kind === "avatar" ? "object-cover" : "object-contain"}`} />
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                <span className="max-w-56 truncate">{pending.file.name}</span>
                {pending.width && pending.height ? <span>• {pending.width}×{pending.height}</span> : null}
                <span>• {(pending.file.size / 1024).toFixed(0)} KB</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderColor: "var(--border-default)" }}>
              <Button type="button" variant="ghost" size="sm" autoFocus onClick={() => { setReviewing(false); releasePending(); }}>Cancel</Button>
              <Button type="button" size="sm" onClick={() => void startUpload()}>
                <Upload size={15} /> Use {kind === "avatar" ? "picture" : "logo"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
