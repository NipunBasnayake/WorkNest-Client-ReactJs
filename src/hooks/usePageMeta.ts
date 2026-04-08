import { useEffect } from "react";
import { usePage } from "@/app/layouts/PageMetaContext";

const APP_NAME = "WorkNest";

function toDocumentTitle(title: string): string {
  const cleanTitle = title.trim();
  if (!cleanTitle) return APP_NAME;
  if (/worknest/i.test(cleanTitle)) return cleanTitle;
  return `${cleanTitle} - ${APP_NAME}`;
}

/**
 * Call at the top of any authenticated page to set the topbar title and breadcrumb.
 * @example usePage({ title: "Employees", breadcrumb: ["Workspace", "Employees"] })
 */
export function usePageMeta(opts: { title: string; breadcrumb?: string[] }) {
  const { setTitle, setBreadcrumb } = usePage();
  const breadcrumb = opts.breadcrumb ?? [];
  const breadcrumbKey = breadcrumb.join("::");
  const title = opts.title.trim();
  const documentTitle = toDocumentTitle(title);

  useEffect(() => {
    setTitle(title || APP_NAME);
    setBreadcrumb(breadcrumb);
    document.title = documentTitle;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbKey, documentTitle, setBreadcrumb, setTitle, title]);
}
