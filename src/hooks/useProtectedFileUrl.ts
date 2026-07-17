import { useEffect, useState } from "react";
import { fetchProtectedFileUrl } from "@/services/uploads/fileUploadService";

interface ResolvedFileUrl {
  source: string;
  url: string;
}

export function useProtectedFileUrl(src?: string | null): string | null {
  const [resolved, setResolved] = useState<ResolvedFileUrl | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!src) return () => undefined;

    void fetchProtectedFileUrl(src)
      .then((url) => {
        if (!active) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url.startsWith("blob:") ? url : null;
        setResolved({ source: src, url });
      })
      .catch(() => {
        if (active) setResolved(null);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return src && resolved?.source === src ? resolved.url : null;
}
