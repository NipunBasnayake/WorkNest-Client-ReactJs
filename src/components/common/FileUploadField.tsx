import { useState, type ChangeEvent } from "react";
import { Download, ExternalLink, FileText, Image as ImageIcon, LoaderCircle, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ProtectedFileImage } from "@/components/common/ProtectedFileImage";
import { useToast } from "@/hooks/useToast";
import {
  deleteUploadedFile,
  openUploadedFile,
  replaceUploadedFile,
  uploadDocumentFiles,
  uploadImageFiles,
  type StorageCategory,
} from "@/services/uploads/fileUploadService";
import type { UploadedFileAsset } from "@/types";

interface FileUploadFieldProps {
  id: string;
  label: string;
  hint?: string;
  folder: string;
  category?: StorageCategory;
  kind: "image" | "document";
  value: UploadedFileAsset[];
  onChange: (next: UploadedFileAsset[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export function FileUploadField({
  id,
  label,
  hint,
  folder,
  category,
  kind,
  value,
  onChange,
  multiple = false,
  disabled = false,
}: FileUploadFieldProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [replacingUrl, setReplacingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const uploaded =
        kind === "image"
          ? await uploadImageFiles(files, { folder, category, onProgress: setProgress })
          : await uploadDocumentFiles(files, { folder, category, onProgress: setProgress });

      const next = multiple ? [...value, ...uploaded] : uploaded.slice(0, 1);
      onChange(next);
      toast.success({
        title: kind === "image" ? "Image uploaded" : "File uploaded",
        description: `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} ready.`,
      });
    } catch (uploadError: unknown) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
      toast.error({ title: "Upload failed", description: message });
    } finally {
      setUploading(false);
      setProgress(0);
      event.target.value = "";
    }
  }

  async function handleRemove(asset: UploadedFileAsset) {
    setDeletingUrl(asset.url);
    try {
      if (asset.temporary) await deleteUploadedFile(asset);
      onChange(value.filter((item) => item.url !== asset.url));
    } catch (deleteError: unknown) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete the file.";
      setError(message);
      toast.error({ title: "Delete failed", description: message });
    } finally {
      setDeletingUrl(null);
    }
  }

  async function handleOpen(asset: UploadedFileAsset) {
    try {
      await openUploadedFile(asset);
    } catch (openError: unknown) {
      const message = openError instanceof Error ? openError.message : "Unable to open the file.";
      toast.error({ title: "Preview failed", description: message });
    }
  }

  async function handleReplace(asset: UploadedFileAsset, file?: File) {
    if (!file) return;
    setReplacingUrl(asset.url);
    setError(null);
    try {
      const replacement = await replaceUploadedFile(asset, file, setProgress);
      onChange(value.map((item) => item.url === asset.url ? replacement : item));
      toast.success({ title: "File replaced", description: `${replacement.name} is ready.` });
    } catch (replaceError: unknown) {
      const message = replaceError instanceof Error ? replaceError.message : "Unable to replace the file.";
      setError(message);
      toast.error({ title: "Replace failed", description: message });
    } finally {
      setReplacingUrl(null);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
        {hint ? (
          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            {hint}
          </p>
        ) : null}
      </div>

      <label
        htmlFor={id}
        className={`${!multiple && value.length > 0 ? "hidden" : "flex"} cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-5 text-center transition ${
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-primary-400 hover:bg-primary-50/60 dark:hover:bg-primary-950/10"
        }`}
        style={{
          borderColor: error ? "rgba(239,68,68,0.4)" : "var(--border-default)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        {uploading ? (
          <LoaderCircle size={18} className="animate-spin" style={{ color: "var(--color-primary-500)" }} />
        ) : (
          <UploadCloud size={18} style={{ color: "var(--color-primary-500)" }} />
        )}
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {uploading ? `Uploading ${progress}%` : kind === "image" ? "Upload image" : "Upload documents"}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            {kind === "image" ? "PNG, JPEG, or WebP up to 2 MB." : "PDF, DOCX, Office, ZIP, or image files up to 10 MB."}
          </p>
        </div>
        <input
          id={id}
          type="file"
          className="hidden"
          accept={kind === "image" ? ".png,.jpg,.jpeg,.webp" : ".pdf,.docx,.xlsx,.pptx,.zip,.png,.jpg,.jpeg,.webp"}
          disabled={disabled || uploading}
          multiple={multiple}
          onChange={handleFileChange}
        />
      </label>

      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : null}

      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((asset) => {
            const isImage = asset.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(asset.name);

            return (
              <div
                key={asset.url}
                className="flex items-center gap-3 rounded-2xl border px-3 py-3"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
              >
                {isImage ? (
                  <ProtectedFileImage
                    src={asset.url}
                    alt={asset.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
                  >
                    {kind === "image" ? <ImageIcon size={18} /> : <FileText size={18} />}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {asset.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {asset.size ? <span>{Math.max(1, Math.round(asset.size / 1024))} KB</span> : null}
                    <button
                      type="button"
                      onClick={() => void handleOpen(asset)}
                      className="inline-flex items-center gap-1 font-semibold no-underline"
                      style={{ color: "var(--color-primary-600)" }}
                    >
                      Open
                      <ExternalLink size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void openUploadedFile(asset, true)}
                      className="inline-flex items-center gap-1 font-semibold"
                      style={{ color: "var(--color-primary-600)" }}
                    >
                      Download
                      <Download size={12} />
                    </button>
                  </div>
                </div>

                <label
                  className="inline-flex cursor-pointer items-center rounded-lg p-2 hover:bg-primary-500/10"
                  title="Replace file"
                  aria-label={`Replace ${asset.name}`}
                >
                  {replacingUrl === asset.url ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  <input
                    type="file"
                    className="hidden"
                    accept={kind === "image" ? ".png,.jpg,.jpeg,.webp" : ".pdf,.docx,.xlsx,.pptx,.zip,.png,.jpg,.jpeg,.webp"}
                    disabled={disabled || uploading || replacingUrl !== null}
                    onChange={(event) => {
                      void handleReplace(asset, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleRemove(asset)}
                  disabled={disabled || uploading || deletingUrl === asset.url}
                >
                  <Trash2 size={14} color="#ef4444" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
