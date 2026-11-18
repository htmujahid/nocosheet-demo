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

  const deleteForm = useMutation({
    ...deleteFormMutationOptions,
    onSuccess: async () => {
      onOpenChange(false);
      onDeleted();
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.forms(tableId) });
      toastManager.add({ type: "success", title: `${form.name} deleted` });
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
            {form.name} will be deleted permanently. Records already submitted through it are not affected.
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
