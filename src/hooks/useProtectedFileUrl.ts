import { useEffect, useState } from "react";
import { acquireProtectedImage, releaseProtectedImage } from "@/services/uploads/protectedImageCache";

interface ResolvedFileUrl {
  source: string;
  url: string;
}

export function useProtectedFileUrl(src?: string | null): string | null {
  const [resolved, setResolved] = useState<ResolvedFileUrl | null>(null);

  useEffect(() => {
    let active = true;
    if (!src) return () => undefined;

    void acquireProtectedImage(src)
      .then((url) => {
        if (!active) return;
        setResolved({ source: src, url });
      })
      .catch(() => {
        if (active) setResolved(null);
      });

    return () => {
      active = false;
      releaseProtectedImage(src);
    };
  }, [src]);

  return src && resolved?.source === src ? resolved.url : null;
}
