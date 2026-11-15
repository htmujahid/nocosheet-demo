import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TrashIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { deleteTablesMutationOptions } from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

type DeleteTablesProps = {
  workspace: string;
  ids: number[];
  onDeleted: (count: number) => Promise<unknown> | void;
};

export function DeleteTablesAlert({
  workspace,
  ids,
  onDeleted,
  open,
  onOpenChange,
  trigger,
}: DeleteTablesProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
}) {
  const queryClient = useQueryClient();
  const count = ids.length;
  const noun = count === 1 ? "table" : "tables";

  const deleteTables = useMutation({
    ...deleteTablesMutationOptions,
    onSuccess: async () => {
      onOpenChange(false);
      await onDeleted(count);
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      toastManager.add({ type: "success", title: `${count} ${noun} moved to trash` });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) deleteTables.reset();
      }}
    >
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {noun}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count === 1
              ? `The selected table moves to the trash for ${TRASH_RETENTION_DAYS} days, then it's deleted forever with its columns, views and every record.`
              : `The selected tables move to the trash for ${TRASH_RETENTION_DAYS} days, then they're deleted forever with their columns, views and every record.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteTables.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteTables.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteTables.isPending}
            onClick={() => deleteTables.mutate({ workspace, ids })}
          >
            Delete {noun}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}

export function DeleteTablesDialog({
  label,
  size,
  ...props
}: DeleteTablesProps & {
  label?: string;
  size?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);

  return (
    <DeleteTablesAlert
      {...props}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="destructive-outline" size={size}>
          <TrashIcon />
          {label ?? `Delete (${props.ids.length})`}
        </Button>
      }
    />
  );
}
