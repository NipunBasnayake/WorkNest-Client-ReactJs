import { extractList, asRecord, firstDefined, getNumber, getString } from "@/services/http/parsers";
import type { UploadedFileAsset } from "@/types";

function inferName(url: string): string {
  const path = url.split("?")[0] ?? url;
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "file";
}

function normalizeUploadedFileAsset(input: unknown): UploadedFileAsset | null {
  if (typeof input === "string" && input.trim()) {
    const url = input.trim();
    return {
      name: inferName(url),
      url,
    };
  }

  const value = asRecord(input);
  const url = firstDefined(
    getString(value.url),
    getString(value.publicUrl),
    getString(value.fileUrl),
    getString(value.attachmentUrl),
    getString(value.documentUrl)
  );

  if (!url) return null;

  return {
    name: firstDefined(getString(value.name), getString(value.fileName), inferName(url)) ?? "file",
    url,
    path: firstDefined(getString(value.path), getString(value.storagePath)),
    mimeType: firstDefined(getString(value.mimeType), getString(value.contentType), getString(value.type)),
    size: firstDefined(getNumber(value.size), getNumber(value.fileSize)),
    bucket: firstDefined(getString(value.bucket), getString(value.bucketName)),
    uploadedAt: firstDefined(getString(value.uploadedAt), getString(value.createdAt), getString(value.updatedAt)),
  };
}

export function extractUploadedFileAssets(...sources: unknown[]): UploadedFileAsset[] {
  const seen = new Set<string>();
  const assets: UploadedFileAsset[] = [];

  sources.forEach((source) => {
    extractList(source).forEach((item) => {
      const normalized = normalizeUploadedFileAsset(item);
      if (!normalized || seen.has(normalized.url)) return;
      seen.add(normalized.url);
      assets.push(normalized);
    });
  });

  return assets;
}
