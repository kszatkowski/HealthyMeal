import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { PaginationMeta } from "../../../types.ts";
import type { ComponentPropsWithoutRef } from "react";

interface PaginationProps extends ComponentPropsWithoutRef<"nav"> {
  meta: PaginationMeta;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const clampPage = (page: number, totalPages: number) => Math.max(1, Math.min(page, totalPages));

export function Pagination({ meta, currentPage, onPageChange, className, ...props }: PaginationProps) {
  const totalPages = meta.total === 0 ? 1 : Math.ceil(meta.total / meta.limit);
  const safePage = clampPage(currentPage, totalPages);

  const goToPage = (page: number) => {
    const next = clampPage(page, totalPages);
    if (next !== safePage) {
      onPageChange(next);
    }
  };

  return (
    <UiPagination className={className} {...props}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Strona {safePage} z {totalPages}
        </p>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={safePage === 1}
              tabIndex={safePage === 1 ? -1 : undefined}
              onClick={(event) => {
                event.preventDefault();
                goToPage(safePage - 1);
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={safePage === totalPages}
              tabIndex={safePage === totalPages ? -1 : undefined}
              onClick={(event) => {
                event.preventDefault();
                goToPage(safePage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </div>
    </UiPagination>
  );
}
