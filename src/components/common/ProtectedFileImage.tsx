import { useProtectedFileUrl } from "@/hooks/useProtectedFileUrl";

interface ProtectedFileImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProtectedFileImage({ src, alt, className }: ProtectedFileImageProps) {
  const resolvedSrc = useProtectedFileUrl(src);

  if (!resolvedSrc) return <div className={className} aria-label={alt} />;
  return <img src={resolvedSrc} alt={alt} className={className} />;
}
