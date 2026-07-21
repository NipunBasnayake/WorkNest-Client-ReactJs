import { useEffect } from "react";
import { usePage } from "@/app/layouts/PageMetaContext";
import { useBranding } from "@/features/branding/useBranding";

const APP_NAME = "WorkNest";

function toDocumentTitle(title: string, applicationName: string): string {
  const cleanTitle = title.trim();
  const cleanApplicationName = applicationName.trim() || APP_NAME;
  if (!cleanTitle) return cleanApplicationName;
  if (cleanTitle.toLocaleLowerCase().includes(cleanApplicationName.toLocaleLowerCase())) return cleanTitle;
  return `${cleanTitle} - ${cleanApplicationName}`;
}

/**
 * Call at the top of any authenticated page to set the topbar title and breadcrumb.
 * @example usePage({ title: "Employees", breadcrumb: ["Workspace", "Employees"] })
 */
export function usePageMeta(opts: { title: string; breadcrumb?: string[] }) {
  const { setTitle, setBreadcrumb } = usePage();
  const { branding } = useBranding();
  const breadcrumb = opts.breadcrumb ?? [];
  const breadcrumbKey = breadcrumb.join("::");
  const title = opts.title.trim();
  const documentTitle = toDocumentTitle(title, branding.companyName);

  useEffect(() => {
    setTitle(title || branding.companyName || APP_NAME);
    setBreadcrumb(breadcrumb);
    document.title = documentTitle;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branding.companyName, breadcrumbKey, documentTitle, setBreadcrumb, setTitle, title]);
}
