import { ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import type { UploadedFileAsset } from "@/types";

interface FileAssetListProps {
  items: UploadedFileAsset[];
  emptyLabel?: string;
}

export function FileAssetList({
  items,
  emptyLabel = "No files attached yet.",
}: FileAssetListProps) {
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
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border px-3 py-3 no-underline transition hover:border-primary-400"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
          >
            {isImage ? (
              <img src={item.url} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
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

            <span
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--color-primary-600)" }}
            >
              Open
              <ExternalLink size={12} />
            </span>
          </a>
        );
      })}
    </div>
  );
}
