export type ShareOutcome = "copied" | "prompt" | "shared" | "cancelled";

export function buildCareersUrl(tenantSlug: string) {
  return `${window.location.origin}/${tenantSlug}/careers`;
}

export function buildVacancyUrl(tenantSlug: string, jobSlug: string) {
  return `${buildCareersUrl(tenantSlug)}/${jobSlug}`;
}

export async function copyPublicUrl(url: string): Promise<ShareOutcome> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      // Fall through to selectable prompt.
    }
  }

  window.prompt("Copy this public URL", url);
  return "prompt";
}

export function openPublicUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function sharePublicUrl({
  title,
  text,
  url,
}: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareOutcome> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Fall back to copying if the share target rejects unexpectedly.
    }
  }

  return copyPublicUrl(url);
}
