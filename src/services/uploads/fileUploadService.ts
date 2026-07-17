import { apiClient, buildTenantApiUrl } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { ApiResponse, UploadedFileAsset } from "@/types";

export type StorageCategory =
  | "WORKSPACE_LOGO"
  | "WORKSPACE_BANNER"
  | "EMPLOYEE_AVATAR"
  | "PROJECT_ATTACHMENT"
  | "TASK_ATTACHMENT"
  | "ANNOUNCEMENT_ATTACHMENT"
  | "LEAVE_ATTACHMENT"
  | "CHAT_ATTACHMENT"
  | "CANDIDATE_RESUME"
  | "DOCUMENT"
  | "TEMPORARY";

type UploadKind = "image" | "document";

interface UploadOptions {
  folder?: string;
  category?: StorageCategory;
  onProgress?: (percentage: number) => void;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const STORAGE_BUCKET_NAME = "worknest-local";
const DOCUMENT_EXTENSIONS = new Set(["pdf", "docx", "xlsx", "pptx", "zip"]);

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index + 1).toLowerCase();
}

function validateFile(file: File, kind: UploadKind): void {
  if (kind === "image" && !file.type.startsWith("image/")) {
    throw new Error("Please choose a PNG, JPEG, or WebP image.");
  }

  if (kind === "document" && !DOCUMENT_EXTENSIONS.has(extensionOf(file.name)) && !file.type.startsWith("image/")) {
    throw new Error("Supported files are PDF, DOCX, spreadsheets, presentations, ZIP, PNG, JPEG, and WebP.");
  }

  const maxSize = kind === "image" ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size > maxSize) {
    throw new Error(`File is too large. Maximum size is ${kind === "image" ? "2 MB" : "10 MB"}.`);
  }
}

export function getStoredFileId(asset: Pick<UploadedFileAsset, "id" | "path" | "url">): string | null {
  if (asset.id && /^\d+$/.test(asset.id)) return asset.id;
  const internalMatch = asset.path?.match(/^wnfileid:\/\/(\d+)$/);
  if (internalMatch) return internalMatch[1];
  const apiMatch = asset.url.match(/\/files\/(\d+)(?:\/(?:preview|download))?(?:\?.*)?$/);
  return apiMatch?.[1] ?? null;
}

function normalizeUploadResponse(payload: UploadedFileAsset, file: File): UploadedFileAsset {
  if (!payload?.url) throw new Error("Local upload response did not include a file URL.");
  const normalized = {
    ...payload,
    name: payload.name || file.name,
    mimeType: payload.mimeType || file.type || undefined,
    size: payload.size ?? file.size,
    bucket: payload.bucket || STORAGE_BUCKET_NAME,
    temporary: true,
  };
  return { ...normalized, id: getStoredFileId(normalized) ?? undefined };
}

async function uploadFile(file: File, kind: UploadKind, options: UploadOptions): Promise<UploadedFileAsset> {
  validateFile(file, kind);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", kind === "image" ? "image" : "doc");
  if (options.folder) formData.append("folder", options.folder);
  if (options.category) formData.append("category", options.category);

  const { data } = await apiClient.post<UploadedFileAsset>(buildTenantApiUrl("/files/upload"), formData, {
    onUploadProgress: (event) => {
      if (!event.total) return;
      options.onProgress?.(Math.min(100, Math.round((event.loaded * 100) / event.total)));
    },
  });
  return normalizeUploadResponse(data, file);
}

async function uploadFiles(files: File[], kind: UploadKind, options: UploadOptions): Promise<UploadedFileAsset[]> {
  const progress = files.map(() => 0);
  return Promise.all(files.map((file, index) => uploadFile(file, kind, {
    ...options,
    onProgress: (percentage) => {
      progress[index] = percentage;
      options.onProgress?.(Math.round(progress.reduce((sum, value) => sum + value, 0) / files.length));
    },
  })));
}

export async function deleteUploadedFile(asset: UploadedFileAsset): Promise<void> {
  const id = getStoredFileId(asset);
  if (!id) return;
  await apiClient.delete(buildTenantApiUrl(`/files/${id}`));
}

export async function replaceUploadedFile(
  asset: UploadedFileAsset,
  file: File,
  onProgress?: (percentage: number) => void
): Promise<UploadedFileAsset> {
  const id = getStoredFileId(asset);
  if (!id) throw new Error("This legacy file cannot be replaced through managed storage.");
  validateFile(file, file.type.startsWith("image/") ? "image" : "document");
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.put<ApiResponse<UploadedFileAsset & { originalName?: string; contentType?: string }> | (UploadedFileAsset & { originalName?: string; contentType?: string })>(
    buildTenantApiUrl(`/files/${id}`),
    formData,
    {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
    }
  );
  const payload = unwrapApiData<UploadedFileAsset & { originalName?: string; contentType?: string }>(data);
  return {
    ...payload,
    id,
    path: `wnfileid://${id}`,
    name: payload.name || payload.originalName || file.name,
    mimeType: payload.mimeType || payload.contentType || file.type,
    temporary: asset.temporary,
  };
}

export async function fetchProtectedFileUrl(url: string): Promise<string> {
  if (/^(?:blob:|data:)/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const { data } = await apiClient.get<Blob>(url, { responseType: "blob" });
  return URL.createObjectURL(data);
}

export async function openUploadedFile(asset: UploadedFileAsset, download = false): Promise<void> {
  const id = getStoredFileId(asset);
  const source = id
    ? buildTenantApiUrl(`/files/${id}/${download ? "download" : "preview"}`)
    : asset.url;
  const objectUrl = await fetchProtectedFileUrl(source);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  if (download) anchor.download = asset.name;
  anchor.click();
  if (objectUrl.startsWith("blob:")) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function resolveStorageUrl(_bucket: string, path: string): Promise<string> {
  if (path.startsWith("/api/") || /^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export async function getStorageFileUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const url = await resolveStorageUrl(bucket, path);
    const objectUrl = await fetchProtectedFileUrl(url);
    if (objectUrl.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
    return url;
  } catch {
    return null;
  }
}

export async function debugStorageBucketAccess(
  bucket = STORAGE_BUCKET_NAME
): Promise<{ ok: boolean; buckets: string[]; expectedFound: boolean }> {
  return { ok: true, buckets: [STORAGE_BUCKET_NAME], expectedFound: bucket === STORAGE_BUCKET_NAME };
}

export function uploadImageFiles(files: File[], options: UploadOptions): Promise<UploadedFileAsset[]> {
  return uploadFiles(files, "image", options);
}

export function uploadDocumentFiles(files: File[], options: UploadOptions): Promise<UploadedFileAsset[]> {
  return uploadFiles(files, "document", options);
}
