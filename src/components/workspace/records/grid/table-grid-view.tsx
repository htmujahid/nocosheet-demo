import { useEffect, useMemo } from "react";

import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { notFound } from "@tanstack/react-router";

import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { columnsCollection } from "@/data/workspace/columns";
import { tablesCollection } from "@/data/workspace/tables";
import { useAccess } from "@/hooks/use-access";
import { RECORD_PAGE_SIZES } from "@/lib/records/query";

import { ViewsMenu } from "../../views/views-menu";
import { buildViewerColumns, withoutIdColumn } from "../columns";
import { RecordsGrid, type ViewerRow } from "../records-grid";
import { useDraftRow } from "../use-draft-row";
import { useUpdateCell } from "../use-update-cell";
import { GridToolbar } from "./grid-toolbar";
import { RecordsPagination } from "./records-pagination";
import { SelectionBar } from "./selection-bar";
import { useGridTable } from "./use-grid-table";
import { useRecordRows } from "./use-record-rows";
import { useRecordsPaging, useRecordsQuery } from "./use-records-query";

const ownerOf = (row: ViewerRow) => (row.created_by as { id?: string } | null | undefined)?.id;

export function TableGridView({
  workspace,
  tableId,
  onOpenRecord,
  onOpenAssistant,
}: {
  workspace: string;
  tableId: number;
  onOpenRecord?: (id: number) => void;
  onOpenAssistant?: () => void;
}) {
  const access = useAccess();
  const { data: table } = useLiveSuspenseQuery((q) =>
    q
      .from({ table: tablesCollection })
      .where(({ table }) => eq(table.id, tableId))
      .findOne(),
  );
  if (!table) throw notFound();
  const { data: tableColumns } = useLiveSuspenseQuery((q) =>
    q.from({ column: columnsCollection(tableId) }).orderBy(({ column }) => column.position),
  );
  const columns = useMemo(
    () =>
      withoutIdColumn(
        buildViewerColumns({ titleColumnId: table.titleColumnId, columns: tableColumns }),
      ),
    [table.titleColumnId, tableColumns],
  );
  const { query, setUrlQuery, setPage } = useRecordsQuery(columns);

  const updateCell = useUpdateCell({ tableId });
  const { rows, hasMore } = useRecordRows({
    tableId,
    columns,
    view: query,
  });
  const draft = useDraftRow({ tableId, columns });
  const paging = useRecordsPaging({ hasMore, query, setPage });

  const grid = useGridTable({
    columns,
    rows,
    query,
    setQuery: setUrlQuery,
    paging,
  });
  const queryKey = JSON.stringify(query);
  useEffect(() => {
    grid.resetRowSelection();
  }, [queryKey]);
  const selectedRows = rows.filter((row) => grid.state.rowSelection[String(row.id)]);

  const filtered = query.q !== "" || query.filters.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {selectedRows.length > 0 ? (
        <SelectionBar
          workspace={workspace}
          tableId={tableId}
          select={{
            canDelete: (row) => access.canOn(tableId, "delete", ownerOf(row)),
          }}
          grid={grid}
          selected={selectedRows}
          pageRows={rows.length}
          paging={paging}
          draft={access.can(tableId, "create") ? draft : undefined}
        />
      ) : (
        <GridToolbar
          grid={grid}
          columns={columns}
          query={query}
          draft={access.can(tableId, "create") ? draft : undefined}
        >
          <ViewsMenu workspace={workspace} table={String(tableId)} />
          {onOpenAssistant && (
            <Button variant="outline" aria-label="Assistant" onClick={onOpenAssistant}>
              <SparklesIcon aria-hidden="true" />
              <span className="max-sm:hidden">Assistant</span>
            </Button>
          )}
        </GridToolbar>
      )}

      <div className="relative min-h-60 flex-1 bg-background">
        <RecordsGrid
          table={grid}
          columns={columns}
          rows={rows}
          workspace={workspace}
          canEdit={access.can(tableId, "update")}
          tableId={tableId}
          canEditRow={(row) => access.canOn(tableId, "update", ownerOf(row))}
          canDeleteRow={(row) => access.canOn(tableId, "delete", ownerOf(row))}
          onDeleted={(deleted) => {
            grid.resetRowSelection();
            if (deleted >= rows.length && paging.hasPrevious) void paging.previous();
          }}
          draft={access.can(tableId, "create") ? draft : undefined}
          onOpenRecord={onOpenRecord}
          onCellChange={(original, draft, column) => void updateCell(original, draft, column)}
          sort={query.sortKey}
          order={query.order}
          empty={filtered ? "No records match your filters." : "This table has no records yet."}
        />
      </div>
      <div className="border-t px-4 py-2">
        <RecordsPagination table={grid} count={rows.length} pageSizes={RECORD_PAGE_SIZES} />
      </div>
    </div>
  );
}
