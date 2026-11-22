import { useEffect, useMemo, useState } from "react";

import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { functionalUpdate, useTable } from "@tanstack/react-table";

import { SearchIcon } from "lucide-react";
import { useQueryStates } from "nuqs";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { dataTableFeatures } from "@/components/shared/data-table/features";
import { Frame, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { type TableRow, tablesCollection } from "@/data/workspace/tables";
import { useAccess } from "@/hooks/use-access";
import { useSession } from "@/hooks/use-session";
import { tablesSearchParams, type TablesQuery } from "@/lib/tables/query";

import { DeleteTablesDialog } from "./delete-tables-dialog";
import { tablesColumns } from "./tables-columns";

export type TablesRow = TableRow;

const byText = (a: string | null, b: string | null) =>
  (a ?? "").localeCompare(b ?? "", undefined, { sensitivity: "base" });

const comparers: Record<TablesQuery["sort"], (a: TablesRow, b: TablesRow) => number> = {
  name: (a, b) => byText(a.name, b.name),
  groupName: (a, b) => byText(a.groupName, b.groupName),
  updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
};

function pageOfTables(tables: TablesRow[], query: TablesQuery) {
  const needle = query.q.trim().toLowerCase();
  const matching = needle
    ? tables.filter(
        (table) =>
          table.name.toLowerCase().includes(needle) ||
          table.description?.toLowerCase().includes(needle),
      )
    : tables;
  const direction = query.order === "desc" ? -1 : 1;
  const sorted = [...matching].sort(
    (a, b) => direction * comparers[query.sort](a, b) || a.id - b.id,
  );
  const start = (query.page - 1) * query.pageSize;
  return { rows: sorted.slice(start, start + query.pageSize), total: sorted.length };
}

export function TablesTable({
  workspace,
  empty,
  placeholder,
}: {
  workspace: string;
  empty: React.ReactNode;
  placeholder: React.ReactNode;
}) {
  const [query, setQuery] = useQueryStates(tablesSearchParams, { history: "replace" });
  const onQueryChange = (patch: Partial<TablesQuery>) => void setQuery(patch);
  const access = useAccess();
  const { data: tables } = useLiveSuspenseQuery((q) => q.from({ table: tablesCollection }));
  const columns = useMemo(
    () => (access.admin ? tablesColumns : tablesColumns.filter((column) => column.id !== "select")),
    [access.admin],
  );
  const listed = useMemo(
    () => (access.admin ? tables : tables.filter((table) => !table.isHidden)),
    [tables, access.admin],
  );
  const { rows, total } = useMemo(() => pageOfTables(listed, query), [listed, query]);

  const table = useTable(
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
          pageSize: next.pageSize as TablesQuery["pageSize"],
        });
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, [
          { id: query.sort, desc: query.order === "desc" },
        ]);
        if (!next) return;
        onQueryChange({
          sort: next.id as TablesQuery["sort"],
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
    const timeout = setTimeout(() => table.setGlobalFilter(search), 300);
    return () => clearTimeout(timeout);
  }, [search, query.q, table]);

  const selectedIds = Object.entries(table.state.rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id));

  if (tables.length === 0) return placeholder;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search tables"
            placeholder="Search tables"
            className="ps-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <DeleteTablesDialog
              workspace={workspace}
              ids={selectedIds}
              onDeleted={(deleted) => {
                table.resetRowSelection();
                const lastPage = Math.max(1, Math.ceil((total - deleted) / query.pageSize));
                if (query.page > lastPage) onQueryChange({ page: lastPage });
              }}
            />
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <Frame>
        <DataTable table={table} empty={empty} />
        <FrameFooter className="p-2">
          <DataTablePagination
            page={query.page}
            pageSize={query.pageSize}
            total={total}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </FrameFooter>
      </Frame>
    </div>
  );
}
