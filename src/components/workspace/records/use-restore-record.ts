import { useDbClient } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { recordsCollection } from "@/data/workspace/records";
import { restoreRecord } from "@/data/workspace/trash";

export function useRestoreRecord(workspace: string, tableId: number) {
  const queryClient = useQueryClient();
  const dbClient = useDbClient();
  const navigate = useNavigate();

  return async (recordIds: number[]) => {
    let restored = 0;
    let failed: { recordId: number; error: Error } | null = null;

    for (const recordId of recordIds) {
      try {
        await restoreRecord({ workspace, tableId, recordId });
        restored++;
      } catch (error) {
        failed = { recordId, error: error instanceof Error ? error : new Error("Restore failed") };
        break;
      }
    }

    if (restored > 0) {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.recordsTrash(tableId) });
      await dbClient
        .collection(recordsCollection(tableId))
        .utils.pull()
        .catch(() => undefined);
      toastManager.add({
        type: "success",
        title: `Restored ${restored} ${restored === 1 ? "record" : "records"}`,
      });
    }

    if (failed) {
      toastManager.add({
        type: "error",
        title: "Couldn't restore the record",
        description: failed.error.message,
      });
      void navigate({
        to: "/workspaces/$workspace/tables/$table/trash/$record",
        params: { workspace, table: String(tableId), record: String(failed.recordId) },
      });
    }

    return !failed;
  };
}
