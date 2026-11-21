import { useDbClient } from "@tanstack/react-db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Undo2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { TrashRows, type TrashRow } from "@/components/workspace/trash/trash-rows";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  deletedTablesQueryOptions,
  restoreTableMutationOptions,
  tablesCollection,
} from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

function Actions({ workspace, row }: { workspace: string; row: TrashRow }) {
  const queryClient = useQueryClient();
  const dbClient = useDbClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tablesTrash() });

  const restore = useMutation({
    ...restoreTableMutationOptions,
    onSuccess: async (restored) => {
      dbClient.collection(tablesCollection).utils.writeUpsert(restored);
      await refresh();
      toastManager.add({ type: "success", title: `${row.name} restored` });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't restore the table",
        description: error.message,
      }),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      loading={restore.isPending}
      onClick={() => restore.mutate({ workspace, id: row.id })}
    >
      <Undo2Icon />
      Restore
    </Button>
  );
}

export function TablesTrash({ workspace }: { workspace: string }) {
  const { data, isPending, error } = useQuery(deletedTablesQueryOptions(workspace));

  return (
    <TrashRows
      rows={data?.rows}
      nameLabel="Table"
      loading={isPending}
      error={error}
      emptyDescription={`Deleted tables stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
      actions={(row) => <Actions workspace={workspace} row={row} />}
    />
  );
}
