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
import { deleteFormsMutationOptions } from "@/data/workspace/forms";
import { workspaceKeys } from "@/data/workspace/keys";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

export function DeleteFormsDialog({
  workspace,
  tableId,
  ids,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  ids: number[];
  onDeleted: (count: number) => Promise<unknown> | void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const count = ids.length;
  const noun = count === 1 ? "form" : "forms";

  const deleteForms = useMutation({
    ...deleteFormsMutationOptions,
    onSuccess: async () => {
      setOpen(false);
      await onDeleted(count);
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.forms(tableId) });
      toastManager.add({ type: "success", title: `${count} ${noun} moved to trash` });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) deleteForms.reset();
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
        <TrashIcon />
        Delete ({count})
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {noun}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count === 1
              ? `The selected form moves to the trash for ${TRASH_RETENTION_DAYS} days, then it's deleted forever.`
              : `The selected forms move to the trash for ${TRASH_RETENTION_DAYS} days, then they're deleted forever.`}{" "}
            The records in the table are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteForms.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteForms.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteForms.isPending}
            onClick={() => deleteForms.mutate({ workspace, tableId, ids })}
          >
            Delete {noun}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
