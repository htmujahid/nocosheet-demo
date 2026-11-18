import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Undo2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { PurgeDialog } from "@/components/workspace/trash/purge-dialog";
import { TrashRows, type TrashRow } from "@/components/workspace/trash/trash-rows";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  deletedColumnsQueryOptions,
  purgeColumnMutationOptions,
  restoreColumnMutationOptions,
} from "@/data/workspace/tables";
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
  const refresh = () => queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });

  const restore = useMutation({
    ...restoreColumnMutationOptions,
    onSuccess: async () => {
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

  const purge = useMutation({
    ...purgeColumnMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: `${row.name} deleted forever` });
    },
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        loading={restore.isPending}
        onClick={() => restore.mutate({ workspace, id: tableId, columnId: row.id })}
      >
        <Undo2Icon />
        Restore
      </Button>
      <PurgeDialog
        label={row.name}
        description={`"${row.name}" and all of its values will be removed for good and can't be restored.`}
        pending={purge.isPending}
        error={purge.error}
        onReset={() => purge.reset()}
        onConfirm={(done) =>
          purge.mutate({ workspace, id: tableId, columnId: row.id }, { onSuccess: done })
        }
      />
    </>
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
