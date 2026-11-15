import { useCallback } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { restoreFormMutationOptions } from "@/data/workspace/forms";
import { workspaceKeys } from "@/data/workspace/keys";

export function useRestoreForm(workspace: string, tableId: number) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation(restoreFormMutationOptions);

  return useCallback(
    async (formId: number, name: string) => {
      try {
        await mutateAsync({ workspace, tableId, formId });
        await queryClient.invalidateQueries({ queryKey: workspaceKeys.forms(tableId) });
        toastManager.add({ type: "success", title: `${name} restored` });
      } catch (error) {
        toastManager.add({
          type: "error",
          title: "Couldn't restore the form",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [mutateAsync, queryClient, workspace, tableId],
  );
}
