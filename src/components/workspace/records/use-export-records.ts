import { useDbClient, useLiveQuery } from "@tanstack/react-db";

import { toastManager } from "@/components/ui/toast";
import { recordsCollection } from "@/data/workspace/records";
import { viewsCollection } from "@/data/workspace/views";
import { downloadCsv, recordsToCsv } from "@/lib/records/export";
import { type LocalRow, selectRows } from "@/lib/records/local";
import { toSlug } from "@/lib/tables/naming";

import { shapeViewerRow, useRelationLabels } from "./grid/use-record-rows";
import type { ViewerRow } from "./records-grid";
import { useReadOwner } from "./use-read-owner";
import { useRecordScope } from "./use-record-scope";

export function useExportRecords(workspace: string, tableId: number, view?: number) {
  const dbClient = useDbClient();
  const { data: views } = useLiveQuery((q) => q.from({ view: viewsCollection(tableId) }));
  const savedView = view === undefined ? undefined : views.find((item) => item.id === view);
  const scope = useRecordScope(workspace, tableId, savedView);
  const label = useRelationLabels(scope.columns);
  const ownerId = useReadOwner(tableId);

  const mutate = (selected?: ViewerRow[]) => {
    let rows = selected;
    if (!rows) {
      const local = scope.columns.map((column) => ({
        columnName: column.key,
        format: column.format,
        isSearchable: false,
      }));
      const all = dbClient.collection(recordsCollection(tableId)).toArray as LocalRow[];
      rows = selectRows(all, local, {
        filters: [],
        q: "",
        sort: { key: null, order: "asc" },
        scope: savedView?.whereExpression,
        ownerId,
      }).map((row) => shapeViewerRow(row, scope.columns, label));
    }
    const filename =
      view === undefined
        ? toSlug(scope.tableName)
        : [toSlug(scope.tableName), toSlug(savedView?.name ?? "")].filter(Boolean).join("-");
    downloadCsv(filename || "records", recordsToCsv(scope.columns, rows));
    toastManager.add({
      type: "success",
      title: `Exported ${rows.length} ${rows.length === 1 ? "record" : "records"}`,
    });
  };

  return { isPending: false, mutate };
}
