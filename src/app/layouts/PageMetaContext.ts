import { createContext, useContext } from "react";

interface PageContextValue {
  setTitle: (title: string) => void;
  setBreadcrumb: (crumbs: string[]) => void;
}

export const PageContext = createContext<PageContextValue>({
  setTitle: () => {},
  setBreadcrumb: () => {},
});

export function usePage() {
  return useContext(PageContext);
}
