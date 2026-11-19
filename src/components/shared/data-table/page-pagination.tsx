import type { PaginationState, ReactTable, RowData } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { dataTableFeatures } from "./features";

export function PagePagination<
  TData extends RowData,
  TSelected extends { pagination: PaginationState },
>({
  table,
  count,
  pageSizes,
}: {
  table: ReactTable<typeof dataTableFeatures, TData, TSelected>;
  count: number;
  pageSizes: readonly number[];
}) {
  const { pageIndex, pageSize } = table.state.pagination;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Select
            items={pageSizes.map((size) => ({ value: size, label: String(size) }))}
            value={pageSize}
            onValueChange={(value) => value !== null && table.setPageSize(value)}
          >
            <SelectTrigger aria-label="Rows per page" className="w-fit min-w-0" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <p className="whitespace-nowrap text-muted-foreground text-sm">
          {count === 0 ? (
            "No results"
          ) : (
            <>
              Showing <strong className="font-medium text-foreground">{count}</strong>{" "}
              {count === 1 ? "record" : "records"} · Page {pageIndex + 1}
            </>
          )}
        </p>
      </div>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className="sm:*:[svg]:hidden"
              render={
                <Button
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  size="sm"
                  variant="outline"
                />
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className="sm:*:[svg]:hidden"
              render={
                <Button
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  size="sm"
                  variant="outline"
                />
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
