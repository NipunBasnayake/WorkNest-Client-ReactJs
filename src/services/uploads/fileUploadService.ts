import { apiClient, buildTenantApiUrl } from "@/services/http/client";
import type { UploadedFileAsset } from "@/types";

type UploadKind = "image" | "document";

interface UploadOptions {
  folder: string;
}

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const STORAGE_BUCKET_NAME = "uploads";

function validateFile(file: File, kind: UploadKind): void {
  if (kind === "image" && !file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (kind === "document") {
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      throw new Error("Only PDF and image files are supported.");
    }
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("File is too large. Maximum size is 10 MB.");
  }
}

async function uploadFile(file: File, kind: UploadKind, options: UploadOptions): Promise<UploadedFileAsset> {
  validateFile(file, kind);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", kind === "image" ? "image" : "doc");
  formData.append("folder", options.folder);

  const { data } = await apiClient.post<UploadedFileAsset>(buildTenantApiUrl("/files/upload"), formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const payload = data as UploadedFileAsset;
  if (!payload?.url) {
    throw new Error("Local upload response did not include a file URL.");
  }

  return {
    name: payload.name || file.name,
    url: payload.url,
    path: payload.path,
    mimeType: payload.mimeType || file.type || undefined,
    size: payload.size ?? file.size,
    bucket: payload.bucket || STORAGE_BUCKET_NAME,
    uploadedAt: payload.uploadedAt,
  };
}

export async function resolveStorageUrl(_bucket: string, path: string): Promise<string> {
  if (path.startsWith("/api/public/") || /^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.replace(/^\/+/, "");
  if (normalizedPath.startsWith("uploads/")) {
    return `/${normalizedPath}`;
  }
  return `/uploads/${normalizedPath}`;
}

export async function getStorageFileUrl(bucket: string, path: string): Promise<string | null> {
  const url = await resolveStorageUrl(bucket, path);
  const result = await fetch(url, { method: "HEAD" });
  if (!result.ok) {
    return null;
  }
  return url;
}

export async function debugStorageBucketAccess(
  bucket = STORAGE_BUCKET_NAME
): Promise<{ ok: boolean; buckets: string[]; expectedFound: boolean }> {
  return {
    ok: true,
    buckets: [STORAGE_BUCKET_NAME],
    expectedFound: bucket === STORAGE_BUCKET_NAME,
  };
}

export async function uploadImageFiles(files: File[], options: UploadOptions): Promise<UploadedFileAsset[]> {
  return Promise.all(files.map((file) => uploadFile(file, "image", options)));
}

export async function uploadDocumentFiles(files: File[], options: UploadOptions): Promise<UploadedFileAsset[]> {
  return Promise.all(files.map((file) => uploadFile(file, "document", options)));
}
