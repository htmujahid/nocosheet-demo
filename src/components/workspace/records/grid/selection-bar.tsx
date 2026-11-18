import { CopyIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DeleteRecordsDialog } from "../delete-records-dialog";
import { RecordExport } from "../record-export";
import type { ViewerRow } from "../records-grid";
import type { DraftRow } from "../use-draft-row";
import type { GridTable } from "./use-grid-table";
import type { RecordsPaging } from "./use-records-query";

export function SelectionBar({
  workspace,
  tableId,
  viewId,
  select,
  grid,
  selected,
  pageRows,
  paging,
  draft,
}: {
  workspace: string;
  tableId: number;
  viewId?: number;
  select: { canDelete: (row: ViewerRow) => boolean };
  grid: GridTable;
  selected: ViewerRow[];
  pageRows: number;
  paging: RecordsPaging;
  draft?: DraftRow;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
      <Button variant="outline" onClick={() => grid.resetRowSelection()}>
        <XIcon />
        {selected.length} selected
      </Button>
      {draft && selected.length === 1 && (
        <Button
          variant="outline"
          disabled={draft.row !== null}
          onClick={() => {
            draft.duplicate(selected[0]);
            grid.resetRowSelection();
          }}
        >
          <CopyIcon aria-hidden="true" />
          Duplicate
        </Button>
      )}
      <div className="ms-auto flex items-center gap-2">
        <RecordExport workspace={workspace} tableId={tableId} viewId={viewId} selected={selected} />
        {selected.every(select.canDelete) && (
          <DeleteRecordsDialog
            workspace={workspace}
            tableId={tableId}
            viewId={viewId}
            ids={selected.map((row) => row.id)}
            onDeleted={(deleted) => {
              grid.resetRowSelection();
              if (deleted >= pageRows && paging.hasPrevious) void paging.previous();
            }}
          />
        )}
      </div>
    </div>
  );
}
