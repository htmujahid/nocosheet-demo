import { useState } from "react";

import { useDbClient } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";

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
import { deleteViewsMutationOptions, viewsCollection } from "@/data/workspace/views";

export function DeleteViewsDialog({
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
  const dbClient = useDbClient();
  const count = ids.length;
  const noun = count === 1 ? "view" : "views";

  const deleteViews = useMutation({
    ...deleteViewsMutationOptions,
    onSuccess: async ({ ids: deleted }) => {
      const viewRows = dbClient.collection(viewsCollection(tableId));
      viewRows.utils.writeBatch(() => {
        for (const id of deleted) viewRows.utils.writeDelete(id);
      });
      setOpen(false);
      await onDeleted(count);
      toastManager.add({ type: "success", title: `${count} ${noun} deleted` });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) deleteViews.reset();
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
              ? `The selected view will be deleted permanently.`
              : `The selected views will be deleted permanently.`}{" "}
            The records in the table are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteViews.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteViews.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteViews.isPending}
            onClick={() => deleteViews.mutate({ workspace, tableId, ids })}
          >
            Delete {noun}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
