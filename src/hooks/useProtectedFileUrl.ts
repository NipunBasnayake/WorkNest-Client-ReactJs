import { useEffect, useState } from "react";
import { acquireProtectedImage, releaseProtectedImage } from "@/services/uploads/protectedImageCache";

interface ResolvedFileUrl {
  source: string;
  url: string | null;
  status: "ready" | "error";
}

export interface ProtectedFileResource {
  url: string | null;
  isLoading: boolean;
  isError: boolean;
}

export function useProtectedFileResource(src?: string | null): ProtectedFileResource {
  const [resolved, setResolved] = useState<ResolvedFileUrl | null>(null);

  useEffect(() => {
    let active = true;
    if (!src) return () => undefined;

    void acquireProtectedImage(src)
      .then((url) => {
        if (!active) return;
        setResolved({ source: src, url, status: "ready" });
      })
      .catch(() => {
        if (active) setResolved({ source: src, url: null, status: "error" });
      });

    return () => {
      active = false;
      releaseProtectedImage(src);
    };
  }, [src]);

  if (!src) return { url: null, isLoading: false, isError: false };
  if (resolved?.source !== src) return { url: null, isLoading: true, isError: false };
  return {
    url: resolved.url,
    isLoading: false,
    isError: resolved.status === "error",
  };
}

export function useProtectedFileUrl(src?: string | null): string | null {
  return useProtectedFileResource(src).url;
}
