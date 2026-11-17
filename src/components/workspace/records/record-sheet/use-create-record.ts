import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { createRecordMutationOptions } from "@/data/workspace/records";
import { buildCreate, toDefaultFormValues } from "@/lib/records/form";

import type { ViewerColumn } from "../columns";
import { useRecordForm } from "./use-record-form";

/** Form state and create mutation shared by the new-record sheet and the new-record page. */
export function useCreateRecord({
  workspace,
  tableId,
  columns,
  onCreated,
}: {
  workspace: string;
  tableId: number;
  columns: ViewerColumn[];
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();

  const create = useMutation({
    ...createRecordMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
      toastManager.add({ type: "success", title: "Record created" });
      onCreated();
    },
  });

  const form = useRecordForm({
    initial: toDefaultFormValues(columns),
    validate: (value) => buildCreate(columns, value).errors,
    onSubmit: (value) =>
      create.mutate({ workspace, tableId, values: buildCreate(columns, value).payload }),
  });

  return { form, create };
}
