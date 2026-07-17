import { apiClient, buildTenantApiUrl } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { extractList, getId } from "@/services/http/parsers";
import { extractUploadedFileAssets } from "@/services/uploads/fileAssetParser";
import { getStoredFileId } from "@/services/uploads/fileUploadService";
import type { ApiResponse, UploadedFileAsset } from "@/types";

export type AttachmentEntityType = "TASK" | "PROJECT" | "ANNOUNCEMENT" | "LEAVE_REQUEST";

function referenceKey(asset: UploadedFileAsset): string {
  return getStoredFileId(asset) ? `file:${getStoredFileId(asset)}` : `url:${asset.url}`;
}

function inferMimeType(asset: UploadedFileAsset): string {
  if (asset.mimeType) return asset.mimeType;
  const extension = asset.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (["png", "jpg", "jpeg", "webp"].includes(extension ?? "")) return `image/${extension === "jpg" ? "jpeg" : extension}`;
  return "application/octet-stream";
}

export async function listEntityAttachments(entityType: AttachmentEntityType, entityId: string): Promise<UploadedFileAsset[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(buildTenantApiUrl("/attachments"), {
    params: { entityType, entityId },
  });
  return extractUploadedFileAssets(extractList(unwrapApiData<unknown>(data)));
}

export async function syncEntityAttachments(
  entityType: AttachmentEntityType,
  entityId: string,
  expected: UploadedFileAsset[]
): Promise<UploadedFileAsset[]> {
  const existingResponse = await apiClient.get<ApiResponse<unknown> | unknown>(buildTenantApiUrl("/attachments"), {
    params: { entityType, entityId },
  });
  const existingRaw = extractList(unwrapApiData<unknown>(existingResponse.data));
  const existing = extractUploadedFileAssets(existingRaw);
  const existingByKey = new Map(existing.map((asset, index) => [referenceKey(asset), { asset, raw: existingRaw[index] }]));
  const expectedByKey = new Map(expected.map((asset) => [referenceKey(asset), asset]));

  await Promise.all(existing
    .filter((asset) => !expectedByKey.has(referenceKey(asset)))
    .map((asset) => {
      const attachmentId = getId(existingByKey.get(referenceKey(asset))?.raw);
      return attachmentId
        ? apiClient.delete(buildTenantApiUrl(`/attachments/${attachmentId}`))
        : Promise.resolve();
    }));

  await Promise.all(expected
    .filter((asset) => !existingByKey.has(referenceKey(asset)))
    .map((asset) => apiClient.post(buildTenantApiUrl("/attachments"), {
      entityType,
      entityId: Number(entityId),
      fileUrl: asset.path ?? asset.url,
      fileName: asset.name,
      fileType: inferMimeType(asset),
      fileSize: asset.size ?? 1,
    })));

  return listEntityAttachments(entityType, entityId);
}
