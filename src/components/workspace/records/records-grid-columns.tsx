import { useMemo } from "react";

import type { ReactTable } from "@tanstack/react-table";

import { ArrowDownIcon, ArrowUpIcon, CheckIcon, HashIcon, Maximize2Icon, XIcon } from "lucide-react";
import type { Column, RenderEditCellContentProps } from "react-data-grid";

import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import type { Aggregate } from "@/lib/records/aggregates";

import { CellEditor, CellValue, cellMode } from "./cells";
import { AggregateCell } from "./cells/aggregate-cell";
import type { ViewerColumn } from "./columns";
import { type DraftRow, isDraft } from "./use-draft-row";

export type ViewerRow = Record<string, unknown> & { id: number };

export type SummaryRow = { count: number; aggregates: ReadonlyMap<string, Aggregate> };

export function useRecordsGridColumns<TSelected extends { rowSelection: Record<string, boolean> }>({
  table,
  byKey,
  workspace,
  canEdit,
  canEditRow,
  onOpenRecord,
  onCellChange,
  selectable,
  draft,
}: {
  table: ReactTable<typeof dataTableFeatures, ViewerRow, TSelected>;
  byKey: ReadonlyMap<string, ViewerColumn>;
  workspace: string;
  canEdit: boolean;
  canEditRow: (row: ViewerRow) => boolean;
  onOpenRecord?: (id: number) => void;
  onCellChange: (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => void;
  selectable: boolean;
  draft?: DraftRow;
}) {
  const visible = table.getVisibleLeafColumns();
  const visibleKey = visible.map((column) => column.id).join("|");
  const selection = table.state.rowSelection;

  return useMemo<Column<ViewerRow, SummaryRow>[]>(
    () => [
      {
        key: "__row",
        name: "",
        width: 76,
        minWidth: 76,
        resizable: false,
        sortable: false,
        cellClass: "records-row-number",
        headerCellClass: "records-row-number",
        renderHeaderCell: () => {
          if (!selectable) return null;
          const all = table.getIsAllPageRowsSelected();
          const some = table.getIsSomePageRowsSelected();
          return (
            <>
              <span className="records-row-index records-row-index-label">
                <HashIcon className="size-3.5 shrink-0" />
                ID
              </span>
              <Checkbox
                aria-label="Select all"
                className="records-row-check"
                data-active={all || some ? "" : undefined}
                checked={all}
                indeterminate={some && !all}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              />
            </>
          );
        },
        summaryCellClass: "records-row-number",
        renderSummaryCell: ({ row }) => (
          <span className="truncate tabular-nums" title="Records on this page">
            {row.count.toLocaleString()}
          </span>
        ),
        renderCell: ({ row }) =>
          isDraft(row) ? (
            <span className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Save row"
                loading={draft?.saving}
                onClick={draft?.save}
              >
                <CheckIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Discard row"
                disabled={draft?.saving}
                onClick={draft?.discard}
              >
                <XIcon />
              </Button>
            </span>
          ) : (
            <>
              <span className="records-row-index">{row.id}</span>
              {selectable && (
                <Checkbox
                  aria-label="Select row"
                  className="records-row-check"
                  checked={!!selection[String(row.id)]}
                  onCheckedChange={(value) => table.getRow(String(row.id)).toggleSelected(!!value)}
                />
              )}
              {onOpenRecord && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Open record"
                  className="records-row-open"
                  onClick={() => onOpenRecord(row.id)}
                >
                  <Maximize2Icon />
                </Button>
              )}
            </>
          ),
      },
      ...visible.flatMap((column): Column<ViewerRow, SummaryRow>[] => {
        const meta = byKey.get(column.id);
        if (!meta) return [];
        const mode = canEdit ? cellMode(meta) : "readonly";
        const inline = mode === "input" || mode === "popup";
        return [
          {
            key: meta.key,
            name: meta.name,
            width: meta.width,
            minWidth: 96,
            resizable: true,
            sortable: column.getCanSort(),
            renderHeaderCell: ({ sortDirection }) => (
              <span className="flex h-full min-w-0 items-center gap-1.5">
                <NamedIcon
                  name={meta.icon}
                  fallback={meta.formatIcon}
                  className="size-3.5 shrink-0"
                />
                <span className="truncate">{meta.name}</span>
                {sortDirection === "ASC" && <ArrowUpIcon className="ms-auto size-3.5 shrink-0" />}
                {sortDirection === "DESC" && (
                  <ArrowDownIcon className="ms-auto size-3.5 shrink-0" />
                )}
              </span>
            ),
            summaryCellClass: "records-summary-cell",
            renderSummaryCell: ({ row }) => (
              <AggregateCell column={meta} aggregate={row.aggregates.get(meta.key)} />
            ),
            editable: inline ? (row) => canEditRow(row) : false,
            editorOptions: { commitOnOutsideClick: mode === "input" },
            renderEditCell: inline
              ? (props) => (
                  <CellEditor
                    {...(props as unknown as RenderEditCellContentProps<ViewerRow>)}
                    column={meta}
                    workspace={workspace}
                  />
                )
              : undefined,
            renderCell: ({ row }) =>
              mode === "toggle" ? (
                <Checkbox
                  aria-label={meta.name}
                  checked={row[meta.key] === true}
                  disabled={!canEditRow(row)}
                  onCheckedChange={(value) =>
                    onCellChange(row, { ...row, [meta.key]: !!value }, meta)
                  }
                />
              ) : (
                <CellValue column={meta} value={row[meta.key]} />
              ),
          },
        ];
      }),
    ],
    [
      visibleKey,
      byKey,
      selection,
      canEdit,
      canEditRow,
      workspace,
      onCellChange,
      onOpenRecord,
      selectable,
      draft,
    ],
  );
}
