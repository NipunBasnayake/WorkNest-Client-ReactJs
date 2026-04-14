import { apiClient } from "@/services/http/client";
import type { UploadedFileAsset } from "@/types";

type UploadKind = "image" | "document";

interface UploadOptions {
  folder: string;
}

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;
const STORAGE_BUCKET_NAME = "uploads";
// Temporary dev flow: backend writes into frontend public/uploads and returns /uploads/* URLs.
const LOCAL_UPLOAD_ENDPOINT = "/api/files/upload";

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

  const maxSize = kind === "image" ? IMAGE_MAX_SIZE : DOCUMENT_MAX_SIZE;
  if (file.size > maxSize) {
    throw new Error(`File is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))} MB.`);
  }
}

async function uploadFile(file: File, kind: UploadKind, _options: UploadOptions): Promise<UploadedFileAsset> {
  validateFile(file, kind);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", kind === "image" ? "image" : "doc");

  const { data } = await apiClient.post<UploadedFileAsset>(LOCAL_UPLOAD_ENDPOINT, formData, {
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
  const normalizedPath = path.replace(/^\/+/, "");
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
