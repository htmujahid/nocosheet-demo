import { useDbClient } from "@tanstack/react-db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Undo2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { TrashRows, type TrashRow } from "@/components/workspace/trash/trash-rows";
import {
  columnsCollection,
  deletedColumnsQueryOptions,
  restoreColumnMutationOptions,
} from "@/data/workspace/columns";
import { workspaceKeys } from "@/data/workspace/keys";
import { tablesCollection } from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

function Actions({
  workspace,
  tableId,
  row,
}: {
  workspace: string;
  tableId: number;
  row: TrashRow;
}) {
  const queryClient = useQueryClient();
  const dbClient = useDbClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: workspaceKeys.columnsTrash(tableId) });

  const restore = useMutation({
    ...restoreColumnMutationOptions,
    onSuccess: async ({ column, table }) => {
      if (column) dbClient.collection(columnsCollection(tableId)).utils.writeUpsert(column);
      dbClient.collection(tablesCollection).utils.writeUpsert(table);
      await refresh();
      toastManager.add({ type: "success", title: `${row.name} restored` });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't restore the column",
        description: error.message,
      }),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      loading={restore.isPending}
      onClick={() => restore.mutate({ workspace, id: tableId, columnId: row.id })}
    >
      <Undo2Icon />
      Restore
    </Button>
  );
}

export function ColumnsTrash({ workspace, tableId }: { workspace: string; tableId: number }) {
  const { data, isPending, error } = useQuery(deletedColumnsQueryOptions(workspace, tableId));

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="error">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <TrashRows
        rows={data?.rows}
        nameLabel="Column"
        loading={isPending}
        error={error}
        emptyDescription={`Deleted columns stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
        detail={(row) => (
          <span className="truncate text-muted-foreground text-xs">
            {row.format.replaceAll("_", " ")}
          </span>
        )}
        actions={(row) => <Actions workspace={workspace} tableId={tableId} row={row} />}
      />
    </div>
  );
}
