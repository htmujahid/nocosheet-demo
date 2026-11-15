import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { deleteFormMutationOptions } from "@/data/workspace/forms";
import { workspaceKeys } from "@/data/workspace/keys";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

import { useRestoreForm } from "./use-restore-form";

export function DeleteFormDialog({
  workspace,
  tableId,
  form,
  open,
  onOpenChange,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  form: { id: number; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const restore = useRestoreForm(workspace, tableId);

  const deleteForm = useMutation({
    ...deleteFormMutationOptions,
    onSuccess: async () => {
      onOpenChange(false);
      onDeleted();
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.forms(tableId) });
      toastManager.add({
        type: "success",
        title: `${form.name} moved to trash`,
        actionProps: { children: "Undo", onClick: () => void restore(form.id, form.name) },
      });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) deleteForm.reset();
      }}
    >
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {form.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {form.name} will move to the trash, where you can restore it for {TRASH_RETENTION_DAYS}{" "}
            days. Records already submitted through it are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteForm.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteForm.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteForm.isPending}
            onClick={() => deleteForm.mutate({ workspace, tableId, formId: form.id })}
          >
            Delete form
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
