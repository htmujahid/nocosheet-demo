import { useEffect, useMemo, useRef } from "react";

import type { ReactTable } from "@tanstack/react-table";

import { DataGrid, type DataGridHandle, type SortColumn } from "react-data-grid";

import type { dataTableFeatures } from "@/components/shared/data-table/features";

import "react-data-grid/lib/styles.css";

import "./records-grid.css";
import { cellMode } from "./cells";
import type { ViewerColumn } from "./columns";
import { RecordsContextMenu } from "./records-context-menu";
import { aggregate } from "@/lib/records/aggregates";
import { type SummaryRow, type ViewerRow, useRecordsGridColumns } from "./records-grid-columns";
import { type DraftRow, isDraft } from "./use-draft-row";

export type { ViewerRow };

const ROW_HEIGHT = 36;

export function RecordsGrid<TSelected extends { rowSelection: Record<string, boolean> }>({
  table,
  columns,
  rows,
  sort,
  order,
  empty,
  workspace,
  tableId,
  viewId,
  canEdit,
  canEditRow,
  canDeleteRow,
  onOpenRecord,
  onCellChange,
  onDeleted,
  selectable = true,
  draft,
}: {
  table: ReactTable<typeof dataTableFeatures, ViewerRow, TSelected>;
  columns: ViewerColumn[];
  rows: ViewerRow[];
  sort: string | null;
  order: "asc" | "desc";
  empty: string;
  workspace: string;
  tableId: number;
  viewId?: number;
  canEdit: boolean;
  canEditRow: (row: ViewerRow) => boolean;
  canDeleteRow: (row: ViewerRow) => boolean;
  onOpenRecord?: (id: number) => void;
  onCellChange: (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => void;
  onDeleted: (count: number) => void;
  selectable?: boolean;
  draft?: DraftRow;
}) {
  const byKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);
  const selection = table.state.rowSelection;
  const gridRef = useRef<DataGridHandle>(null);
  const draftRow = draft?.row ?? null;
  const gridRows = useMemo(() => (draftRow ? [draftRow, ...rows] : rows), [rows, draftRow]);
  const drafting = draftRow !== null;

  useEffect(() => {
    if (!drafting) return;
    gridRef.current?.scrollToCell({ idx: 1, rowIdx: 0 });
    gridRef.current?.setActivePosition({ idx: 1, rowIdx: 0 }, { shouldFocus: true });
  }, [drafting]);

  const changeCell = (original: ViewerRow, next: ViewerRow, column: ViewerColumn) => {
    if (isDraft(original)) draft?.change(next[column.key], column);
    else onCellChange(original, next, column);
  };

  const gridColumns = useRecordsGridColumns({
    table,
    byKey,
    workspace,
    canEdit: canEdit || !!draft,
    canEditRow: (row) => isDraft(row) || canEditRow(row),
    onOpenRecord,
    onCellChange: changeCell,
    selectable,
    draft,
  });

  const summaryRows = useMemo<SummaryRow[]>(
    () =>
      rows.length === 0
        ? []
        : [
            {
              aggregates: new Map(
                columns.map((column) => [
                  column.key,
                  aggregate(
                    column.format,
                    rows.map((row) => row[column.key]),
                  ),
                ]),
              ),
            },
          ],
    [rows, columns],
  );

  const sortColumns: SortColumn[] = sort
    ? [{ columnKey: sort, direction: order === "desc" ? "DESC" : "ASC" }]
    : [];

  return (
    <RecordsContextMenu
      workspace={workspace}
      tableId={tableId}
      viewId={viewId}
      columns={columns}
      canEditRow={canEditRow}
      canDeleteRow={canDeleteRow}
      onOpenRecord={onOpenRecord}
      onDeleted={onDeleted}
    >
      {(onCellContextMenu) => (
        <DataGrid
          className="records-grid"
          aria-label="Records"
          ref={gridRef}
          columns={gridColumns}
          rows={gridRows}
          bottomSummaryRows={summaryRows}
          getRowKey={(row) => row.id}
          rowClass={(row) =>
            isDraft(row)
              ? "records-row-draft"
              : selection[String(row.id)]
                ? "records-row-selected"
                : undefined
          }
          onRowsChange={(next, { indexes, column }) => {
            const meta = byKey.get(String(column.key));
            const index = indexes[0];
            if (!meta || index === undefined) return;
            changeCell(gridRows[index], next[index], meta);
          }}
          onCellKeyDown={(args, event) => {
            if (args.mode !== "ACTIVE" || event.key !== "Enter" || !args.row || !isDraft(args.row))
              return;
            event.preventGridDefault();
            draft?.save();
          }}
          onCellContextMenu={onCellContextMenu}
          onCellDoubleClick={({ row, column }) => {
            const meta = byKey.get(String(column.key));
            if (!meta || isDraft(row)) return;
            const mode = canEdit ? cellMode(meta) : "readonly";
            if (mode === "readonly" || mode === "sheet") onOpenRecord?.(row.id);
          }}
          rowHeight={ROW_HEIGHT}
          summaryRowHeight={ROW_HEIGHT}
          headerRowHeight={ROW_HEIGHT}
          sortColumns={sortColumns}
          onSortColumnsChange={(next) => {
            const last = next.at(-1);
            table.setSorting(last ? [{ id: last.columnKey, desc: last.direction === "DESC" }] : []);
          }}
          renderers={{
            noRowsFallback: (
              <div className="col-span-full flex items-center justify-center p-10 text-muted-foreground text-sm">
                {empty}
              </div>
            ),
          }}
        />
      )}
    </RecordsContextMenu>
  );
}
