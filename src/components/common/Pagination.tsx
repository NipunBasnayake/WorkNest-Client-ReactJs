import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { AppSelect } from "@/components/common/AppSelect";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100] as const;

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  itemLabel?: string;
  className?: string;
}

type PageToken = number | "ellipsis-start" | "ellipsis-end";

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  itemLabel = "records",
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const firstVisible = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastVisible = Math.min(safePage * pageSize, totalItems);
  const pageTokens = getPageTokens(safePage, totalPages);

  return (
    <nav
      aria-label="Table pagination"
      className={cn(
        "flex flex-col gap-4 border-t px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
        <p className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }} aria-live="polite">
          Showing <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{firstVisible.toLocaleString()}–{lastVisible.toLocaleString()}</span> of{" "}
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{totalItems.toLocaleString()}</span> {itemLabel}
        </p>
        <label className="flex items-center gap-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
          Rows per page
          <AppSelect
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="w-20"
          >
            {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </AppSelect>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="px-3"
          disabled={safePage <= 1 || totalItems === 0}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageTokens.map((token) => token === "ellipsis-start" || token === "ellipsis-end" ? (
            <span key={token} className="grid h-9 w-8 place-items-center" style={{ color: "var(--text-tertiary)" }} aria-hidden="true">
              <MoreHorizontal size={16} />
            </span>
          ) : (
            <button
              key={token}
              type="button"
              onClick={() => onPageChange(token)}
              aria-label={`Page ${token}`}
              aria-current={token === safePage ? "page" : undefined}
              className={cn(
                "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-semibold transition-colors",
                token === safePage
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "hover:bg-[var(--bg-surface-hover)]",
              )}
              style={token === safePage ? undefined : { borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
            >
              {token}
            </button>
          ))}
        </div>

        <span className="text-sm font-semibold tabular-nums sm:hidden" style={{ color: "var(--text-secondary)" }}>
          {safePage} / {totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="px-3"
          disabled={safePage >= totalPages || totalItems === 0}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}

function getPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const visiblePages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const tokens: PageToken[] = [];

  visiblePages.forEach((page, index) => {
    const previous = visiblePages[index - 1];
    if (previous && page - previous > 1) tokens.push(previous === 1 ? "ellipsis-start" : "ellipsis-end");
    tokens.push(page);
  });

  return tokens;
}
