import { useEffect } from "react";
import { usePage } from "@/app/layouts/AppLayout";

/**
 * Call at the top of any authenticated page to set the topbar title and breadcrumb.
 * @example usePage({ title: "Employees", breadcrumb: ["Workspace", "Employees"] })
 */
export function usePageMeta(opts: { title: string; breadcrumb?: string[] }) {
  const { setTitle, setBreadcrumb } = usePage();
  const breadcrumb = opts.breadcrumb ?? [];
  const breadcrumbKey = breadcrumb.join("::");

  useEffect(() => {
    setTitle(opts.title);
    setBreadcrumb(breadcrumb);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbKey, opts.title, setBreadcrumb, setTitle]);
}
