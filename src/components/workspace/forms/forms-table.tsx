import { useEffect, useMemo, useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { functionalUpdate, useTable } from "@tanstack/react-table";

import { SearchIcon } from "lucide-react";
import { useQueryStates } from "nuqs";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { dataTableFeatures } from "@/components/shared/data-table/features";
import { Frame, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { formsPageQueryOptions } from "@/data/workspace/forms";
import { useAccess } from "@/hooks/use-access";
import { formsSearchParams, type FormsQuery } from "@/lib/forms/query";

import { DeleteFormsDialog } from "./delete-forms-dialog";
import { formsColumns } from "./forms-columns";

export type FormsRow = NonNullable<ReturnType<typeof useFormsRows>["data"]>["rows"][number];

function useFormsRows(workspace: string, tableId: number, query: FormsQuery) {
  return useQuery({
    ...formsPageQueryOptions(workspace, tableId, query),
    placeholderData: keepPreviousData,
  });
}

export function FormsTable({
  workspace,
  table: tableParam,
  empty,
  placeholder,
}: {
  workspace: string;
  table: string;
  empty: React.ReactNode;
  placeholder: React.ReactNode;
}) {
  const tableId = Number(tableParam);
  const access = useAccess();
  const [query, setQuery] = useQueryStates(formsSearchParams, { history: "replace" });
  const onQueryChange = (patch: Partial<FormsQuery>) => void setQuery(patch);
  const { data, isFetching } = useFormsRows(workspace, tableId, query);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const columns = useMemo(
    () => formsColumns({ workspace, table: tableParam, canManage: access.admin }),
    [workspace, tableParam, access.admin],
  );

  const grid = useTable(
    {
      features: dataTableFeatures,
      columns,
      data: rows,
      getRowId: (row) => String(row.id),
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
      enableRowSelection: access.admin,
      enableMultiSort: false,
      enableSortingRemoval: false,
      rowCount: total,
      state: {
        pagination: { pageIndex: query.page - 1, pageSize: query.pageSize },
        sorting: [{ id: query.sort, desc: query.order === "desc" }],
        globalFilter: query.q,
      },
      onPaginationChange: (updater) => {
        const next = functionalUpdate(updater, {
          pageIndex: query.page - 1,
          pageSize: query.pageSize,
        });
        onQueryChange({
          page: next.pageSize === query.pageSize ? next.pageIndex + 1 : 1,
          pageSize: next.pageSize as FormsQuery["pageSize"],
        });
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, [
          { id: query.sort, desc: query.order === "desc" },
        ]);
        if (!next) return;
        onQueryChange({
          sort: next.id as FormsQuery["sort"],
          order: next.desc ? "desc" : "asc",
          page: 1,
        });
      },
      onGlobalFilterChange: (updater) => {
        const next = functionalUpdate(updater, query.q) as string;
        onQueryChange({ q: next, page: 1 });
      },
    },
    (state) => ({
      rowSelection: state.rowSelection,
      columnVisibility: state.columnVisibility,
    }),
  );

  const [search, setSearch] = useState(query.q);
  useEffect(() => setSearch(query.q), [query.q]);
  useEffect(() => {
    if (search === query.q) return;
    const timeout = setTimeout(() => grid.setGlobalFilter(search), 300);
    return () => clearTimeout(timeout);
  }, [search, query.q, grid]);

  const selectedIds = Object.entries(grid.state.rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id));

  if (data && total === 0 && !query.q) return placeholder;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search forms"
            placeholder="Search forms"
            className="ps-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <DeleteFormsDialog
              workspace={workspace}
              tableId={tableId}
              ids={selectedIds}
              onDeleted={(deleted) => {
                grid.resetRowSelection();
                const lastPage = Math.max(1, Math.ceil((total - deleted) / query.pageSize));
                if (query.page > lastPage) onQueryChange({ page: lastPage });
              }}
            />
          )}
          <DataTableViewOptions table={grid} />
        </div>
      </div>
      <Frame>
        <DataTable table={grid} empty={empty} pending={isFetching} />
        <FrameFooter className="p-2">
          <DataTablePagination
            page={query.page}
            pageSize={query.pageSize}
            total={total}
            onPageChange={(page) => grid.setPageIndex(page - 1)}
          />
        </FrameFooter>
      </Frame>
    </div>
  );
}
