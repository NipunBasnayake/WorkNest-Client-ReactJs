import { useState } from "react";

interface ClientPaginationOptions {
  storageKey: string;
  defaultPageSize?: number;
  resetKey?: string;
}

interface PaginationCursor {
  page: number;
  resetKey: string;
}

const VALID_PAGE_SIZES = new Set([10, 25, 50, 100]);

export function useClientPagination<T>(items: readonly T[], options: ClientPaginationOptions) {
  const { storageKey, defaultPageSize = 10, resetKey = "" } = options;
  const [pageSize, setPageSizeState] = useState(() => readPageSize(storageKey, defaultPageSize));
  const [cursor, setCursor] = useState<PaginationCursor>({ page: 1, resetKey });
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requestedPage = cursor.resetKey === resetKey ? cursor.page : 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  function setCurrentPage(page: number) {
    setCursor({ page: Math.min(Math.max(page, 1), totalPages), resetKey });
  }

  function setPageSize(nextPageSize: number) {
    if (!VALID_PAGE_SIZES.has(nextPageSize)) return;
    setPageSizeState(nextPageSize);
    setCursor({ page: 1, resetKey });
    writePageSize(storageKey, nextPageSize);
  }

  return {
    paginatedItems: items.slice(start, start + pageSize),
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  };
}

export function readPageSize(storageKey: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = Number(window.sessionStorage.getItem(`worknest:page-size:${storageKey}`));
    return VALID_PAGE_SIZES.has(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

export function writePageSize(storageKey: string, pageSize: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`worknest:page-size:${storageKey}`, String(pageSize));
  } catch {
    // Pagination still works when session storage is unavailable.
  }
}
