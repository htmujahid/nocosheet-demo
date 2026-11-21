import { useEffect, useMemo, useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";
import { functionalUpdate, useTable } from "@tanstack/react-table";

import { SearchIcon } from "lucide-react";
import { useQueryStates } from "nuqs";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { dataTableFeatures } from "@/components/shared/data-table/features";
import { Frame } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { type ViewRow, viewsCollection } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";
import { useSession } from "@/hooks/use-session";
import { viewsSearchParams, type ViewsQuery } from "@/lib/views/query";

import { DeleteViewsDialog } from "./delete-views-dialog";
import { viewsColumns } from "./views-columns";

export type ViewsRow = ViewRow & {
  columnCount: number;
};

function useViewsRows(workspace: string, tableId: number, query: ViewsQuery) {
  const { data: views, isReady } = useLiveQuery((q) =>
    q.from({ view: viewsCollection(tableId) }).orderBy(({ view }) => view.position),
  );
  const data = isReady ? views : undefined;
  const rows = useMemo(() => {
    if (!data) return undefined;
    const needle = query.q.trim().toLowerCase();
    const matching = data
      .map((row): ViewsRow => ({ ...row, columnCount: row.selectColumns.length }))
      .filter(
        (row) =>
          !needle ||
          row.name.toLowerCase().includes(needle) ||
          row.description?.toLowerCase().includes(needle),
      );
    const key = (row: (typeof matching)[number]) =>
      query.sort === "name"
        ? row.name.toLowerCase()
        : query.sort === "columnCount"
          ? row.columnCount
          : new Date(row[query.sort]).getTime();
    const direction = query.order === "desc" ? -1 : 1;
    return matching.sort((a, b) => {
      const [x, y] = [key(a), key(b)];
      return (x < y ? -1 : x > y ? 1 : a.id - b.id) * direction;
    });
  }, [data, query.q, query.sort, query.order]);
  return { rows, total: data?.length, isFetching: !isReady };
}

export function ViewsTable({
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
  const [query, setQuery] = useQueryStates(viewsSearchParams, { history: "replace" });
  const onQueryChange = (patch: Partial<ViewsQuery>) => void setQuery(patch);
  const { rows: found, total, isFetching } = useViewsRows(workspace, tableId, query);
  const rows = useMemo(() => found ?? [], [found]);
  const columns = useMemo(
    () => viewsColumns({ workspace, table: tableParam, canManage: access.admin }),
    [workspace, tableParam, access.admin],
  );

  const grid = useTable(
    {
      features: dataTableFeatures,
      columns,
      data: rows,
      getRowId: (row) => String(row.id),
      manualSorting: true,
      manualFiltering: true,
      enableRowSelection: access.admin,
      enableMultiSort: false,
      enableSortingRemoval: false,
      state: {
        sorting: [{ id: query.sort, desc: query.order === "desc" }],
        globalFilter: query.q,
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, [
          { id: query.sort, desc: query.order === "desc" },
        ]);
        if (!next) return;
        onQueryChange({
          sort: next.id as ViewsQuery["sort"],
          order: next.desc ? "desc" : "asc",
        });
      },
      onGlobalFilterChange: (updater) => {
        const next = functionalUpdate(updater, query.q) as string;
        onQueryChange({ q: next });
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

  if (total === 0) return placeholder;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search views"
            placeholder="Search views"
            className="ps-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <DeleteViewsDialog
              workspace={workspace}
              tableId={tableId}
              ids={selectedIds}
              onDeleted={() => grid.resetRowSelection()}
            />
          )}
          <DataTableViewOptions table={grid} />
        </div>
      </div>
      <Frame>
        <DataTable table={grid} empty={empty} pending={isFetching} />
      </Frame>
    </div>
  );
}
