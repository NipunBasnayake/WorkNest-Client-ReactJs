import { Download, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import { ProtectedFileImage } from "@/components/common/ProtectedFileImage";
import { openUploadedFile } from "@/services/uploads/fileUploadService";
import { useToast } from "@/hooks/useToast";
import type { UploadedFileAsset } from "@/types";

interface FileAssetListProps {
  items: UploadedFileAsset[];
  emptyLabel?: string;
}

export function FileAssetList({
  items,
  emptyLabel = "No files attached yet.",
}: FileAssetListProps) {
  const toast = useToast();
  async function openFile(item: UploadedFileAsset, download: boolean) {
    try {
      await openUploadedFile(item, download);
    } catch (error: unknown) {
      toast.error({
        title: download ? "Download failed" : "Preview failed",
        description: error instanceof Error ? error.message : "Unable to access this file.",
      });
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed p-4 text-center text-sm"
        style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isImage = item.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(item.name);
        return (
          <div
            key={item.url}
            className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition hover:border-primary-400"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
          >
            {isImage ? (
              <ProtectedFileImage src={item.url} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
              >
                {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {item.name}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {item.size ? `${Math.max(1, Math.round(item.size / 1024))} KB` : "Public file"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void openFile(item, false)} className="rounded-lg p-2" aria-label={`Preview ${item.name}`}>
                <ExternalLink size={14} />
              </button>
              <button type="button" onClick={() => void openFile(item, true)} className="rounded-lg p-2" aria-label={`Download ${item.name}`}>
                <Download size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
