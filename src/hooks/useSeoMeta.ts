import { useEffect } from "react";
import { useBranding } from "@/features/branding/useBranding";

interface SeoMetaOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
}

const APP_NAME = "WorkNest";

function resolveTitle(title: string, applicationName: string) {
  const cleanTitle = title.trim();
  const cleanApplicationName = applicationName.trim() || APP_NAME;
  if (!cleanTitle) return cleanApplicationName;
  return cleanTitle.toLocaleLowerCase().includes(cleanApplicationName.toLocaleLowerCase())
    ? cleanTitle
    : `${cleanTitle} - ${cleanApplicationName}`;
}

function ensureMeta(selector: string, create: () => HTMLMetaElement) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return existing;
  const element = create();
  element.setAttribute("data-worknest-seo", "true");
  document.head.appendChild(element);
  return element;
}

function setNamedMeta(name: string, content: string) {
  const element = ensureMeta(`meta[name="${name}"]`, () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    return meta;
  });
  element.setAttribute("content", content);
}

function setPropertyMeta(property: string, content: string) {
  const element = ensureMeta(`meta[property="${property}"]`, () => {
    const meta = document.createElement("meta");
    meta.setAttribute("property", property);
    return meta;
  });
  element.setAttribute("content", content);
}

function setCanonical(path?: string) {
  if (!path) return;
  const canonicalUrl = `${window.location.origin}${path}`;
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const element = existing ?? document.createElement("link");
  element.setAttribute("rel", "canonical");
  element.setAttribute("href", canonicalUrl);
  if (!existing) {
    element.setAttribute("data-worknest-seo", "true");
    document.head.appendChild(element);
  }
  setPropertyMeta("og:url", canonicalUrl);
}

export function useSeoMeta({
  title,
  description,
  canonicalPath,
  ogTitle,
  ogDescription,
  noIndex = false,
}: SeoMetaOptions) {
  const { branding } = useBranding();

  useEffect(() => {
    const documentTitle = resolveTitle(title, branding.companyName);
    document.title = documentTitle;
    setNamedMeta("description", description);
    setPropertyMeta("og:title", ogTitle ?? documentTitle);
    setPropertyMeta("og:description", ogDescription ?? description);
    setPropertyMeta("og:type", "website");
    setNamedMeta("robots", noIndex ? "noindex,nofollow" : "index,follow");
    setCanonical(canonicalPath);
  }, [branding.companyName, canonicalPath, description, noIndex, ogDescription, ogTitle, title]);
}
