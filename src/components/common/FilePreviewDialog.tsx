import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileQuestion, LoaderCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { apiClient } from "@/services/http/client";
import {
  getUploadedFileAccessUrl,
  openUploadedFile,
} from "@/services/uploads/fileUploadService";
import type { UploadedFileAsset } from "@/types";

interface FilePreviewDialogProps {
  file: UploadedFileAsset | null;
  onClose: () => void;
}

type PreviewState =
  | { requestKey: string; status: "ready"; objectUrl: string; mimeType: string }
  | { requestKey: string; status: "error"; objectUrl: null; mimeType: string; message: string };

export function FilePreviewDialog({ file, onClose }: FilePreviewDialogProps) {
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const requestKey = `${file?.id ?? file?.url ?? "none"}:${attempt}`;
  const activePreview = preview?.requestKey === requestKey
    ? preview
    : { requestKey, status: "loading" as const, objectUrl: null, mimeType: file?.mimeType ?? "" };

  useEffect(() => {
    if (!file) return;
    const source = getUploadedFileAccessUrl(file, false);
    const controller = new AbortController();
    let objectUrl: string | null = null;

    void apiClient.get<Blob>(source, {
      responseType: "blob",
      signal: controller.signal,
    }).then(({ data }) => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(data);
      setPreview({
        requestKey,
        status: "ready",
        objectUrl,
        mimeType: data.type || file.mimeType || mimeFromName(file.name),
      });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setPreview({
        requestKey,
        status: "error",
        objectUrl: null,
        mimeType: file.mimeType ?? mimeFromName(file.name),
        message: previewErrorMessage(error),
      });
    });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, requestKey]);

  useEffect(() => {
    if (!file) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [file, onClose]);

  const previewKind = useMemo(
    () => classifyPreview(file?.name ?? "", activePreview.mimeType),
    [activePreview.mimeType, file?.name],
  );

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Close file preview"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${file.name}`}
        tabIndex={-1}
        className="relative z-10 flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border-default)" }}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{file.name}</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {activePreview.mimeType || "Unknown file type"}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void openUploadedFile(file, true)}>
            <Download size={14} /> Download
          </Button>
          <button type="button" className="rounded-lg p-2" aria-label="Close preview" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-black/5 p-3 dark:bg-black/25">
          {activePreview.status === "loading" && (
            <div className="flex flex-col items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              <LoaderCircle className="animate-spin" size={28} />
              Loading secure preview…
            </div>
          )}

          {activePreview.status === "error" && (
            <div className="max-w-md rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
              <FileQuestion className="mx-auto" size={36} style={{ color: "var(--text-tertiary)" }} />
              <p className="mt-4 font-semibold" style={{ color: "var(--text-primary)" }}>Preview unavailable</p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{activePreview.message}</p>
              <div className="mt-5 flex justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                  <RefreshCw size={14} /> Retry
                </Button>
                <Button type="button" onClick={() => void openUploadedFile(file, true)}>
                  <Download size={14} /> Download
                </Button>
              </div>
            </div>
          )}

          {activePreview.status === "ready" && previewKind === "image" && (
            <img src={activePreview.objectUrl} alt={file.name} className="max-h-full max-w-full rounded-xl object-contain" />
          )}

          {activePreview.status === "ready" && previewKind === "pdf" && (
            <iframe title={file.name} src={activePreview.objectUrl} className="h-full w-full rounded-xl border-0" />
          )}

          {activePreview.status === "ready" && previewKind === "unsupported" && (
            <div className="max-w-md rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
              <FileQuestion className="mx-auto" size={36} style={{ color: "var(--text-tertiary)" }} />
              <p className="mt-4 font-semibold" style={{ color: "var(--text-primary)" }}>This file cannot be previewed in the browser</p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Office documents and ZIP archives are available as secure downloads.
              </p>
              <Button type="button" className="mt-5" onClick={() => void openUploadedFile(file, true)}>
                <Download size={14} /> Download {file.name}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function classifyPreview(name: string, mimeType: string): "image" | "pdf" | "unsupported" {
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name)) return "image";
  if (mimeType === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  return "unsupported";
}

function mimeFromName(name: string): string {
  if (/\.pdf$/i.test(name)) return "application/pdf";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.webp$/i.test(name)) return "image/webp";
  return "application/octet-stream";
}

function previewErrorMessage(error: unknown): string {
  const status = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;
  if (status === 403) return "You do not have permission to access this file.";
  if (status === 404) return "The file no longer exists or has been removed.";
  if (status && status >= 500) return "The file service is temporarily unavailable. Please retry.";
  return "The preview could not be loaded. Check your connection and retry.";
}
