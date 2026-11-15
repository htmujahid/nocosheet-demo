import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { createRecordMutationOptions } from "@/data/workspace/records";
import { buildCreate, toDefaultFormValues } from "@/lib/records/form";

import { type ViewerColumn } from "../columns";
import { useRecordScope } from "../use-record-scope";
import { RecordForm } from "./record-form";
import { useRecordForm } from "./use-record-form";

function CreateForm({
  workspace,
  tableId,
  viewId,
  tableName,
  columns,
  onCreated,
}: {
  workspace: string;
  tableId: number;
  viewId?: number;
  tableName: string;
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
      create.mutate({ workspace, tableId, viewId, values: buildCreate(columns, value).payload }),
  });

  return (
    <RecordForm
      form={form}
      workspace={workspace}
      tableId={tableId}
      tableName={tableName}
      columns={columns}
      error={create.error}
    >
      <SheetFooter>
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <Button type="submit" loading={create.isPending}>
          Create record
        </Button>
      </SheetFooter>
    </RecordForm>
  );
}

export function CreateRecordSheet({
  workspace,
  tableId,
  viewId,
  onClose,
}: {
  workspace: string;
  tableId: number;
  viewId?: number;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const scope = useRecordScope(workspace, tableId);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup variant="inset" className="max-w-xl">
        <CreateForm
          workspace={workspace}
          tableId={tableId}
          viewId={viewId}
          tableName={scope.tableName}
          columns={scope.columns}
          onCreated={() => setOpen(false)}
        />
      </SheetPopup>
    </Sheet>
  );
}
