export interface ImageUploadRequestOptions {
  signal?: AbortSignal;
  onProgress?: (percentage: number) => void;
}
