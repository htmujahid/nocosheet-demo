import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { recordsExportQueryOptions } from "@/data/workspace/records";
import { viewExportQueryOptions } from "@/data/workspace/views";
import { downloadCsv, recordsToCsv } from "@/lib/records/export";
import { toSlug } from "@/lib/tables/naming";

import type { ViewerRow } from "./records-grid";
import { useRecordScope } from "./use-record-scope";

export function useExportRecords(workspace: string, tableId: number, view?: number) {
  const queryClient = useQueryClient();
  const scope = useRecordScope(workspace, tableId, view === undefined ? undefined : { id: view });

  return useMutation({
    mutationFn: async (selected?: ViewerRow[]) => {
      const { rows, truncated } = selected
        ? { rows: selected, truncated: false }
        : view === undefined
          ? await queryClient.query(recordsExportQueryOptions(workspace, tableId))
          : await queryClient.query(viewExportQueryOptions(workspace, tableId, view));
      const filename =
        view === undefined
          ? toSlug(scope.tableName)
          : [toSlug(scope.tableName), toSlug(scope.name)].filter(Boolean).join("-");
      downloadCsv(filename || "records", recordsToCsv(scope.columns, rows));
      return { count: rows.length, truncated };
    },
    onSuccess: ({ count, truncated }) =>
      toastManager.add({
        type: "success",
        title: `Exported ${count} ${count === 1 ? "record" : "records"}`,
        description: truncated ? `Export is limited to ${count} records.` : undefined,
      }),
    onError: (error) =>
      toastManager.add({ type: "error", title: "Export failed", description: error.message }),
  });
}
