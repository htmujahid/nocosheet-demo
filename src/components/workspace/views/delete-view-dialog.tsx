import { useDbClient } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { deleteViewMutationOptions, viewsCollection } from "@/data/workspace/views";

export function DeleteViewDialog({
  workspace,
  tableId,
  view,
  open,
  onOpenChange,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  view: { id: number; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const dbClient = useDbClient();

  const deleteView = useMutation({
    ...deleteViewMutationOptions,
    onSuccess: ({ ids }) => {
      const viewRows = dbClient.collection(viewsCollection(tableId));
      viewRows.utils.writeBatch(() => {
        for (const id of ids) viewRows.utils.writeDelete(id);
      });
      onOpenChange(false);
      onDeleted();
      toastManager.add({ type: "success", title: `${view.name} deleted` });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) deleteView.reset();
      }}
    >
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {view.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {view.name} will be deleted permanently. The records in the table are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteView.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteView.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteView.isPending}
            onClick={() => deleteView.mutate({ workspace, tableId, viewId: view.id })}
          >
            Delete view
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
