import { useState } from "react";

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { apiKeysQueryOptions } from "@/data/auth/api-keys";
import { deleteApiKeyMutationOptions } from "@/data/auth/delete-api-key";

export function RevokeApiKeyDialog({ keyId, name }: { keyId: string; name: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const revoke = useMutation({
    ...deleteApiKeyMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries(apiKeysQueryOptions);
      setOpen(false);
      toastManager.add({ type: "success", title: "API key revoked" });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) revoke.reset();
      }}
    >
      <AlertDialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        Revoke
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Anything using this key stops working immediately. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {revoke.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{revoke.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={revoke.isPending}
            onClick={() => revoke.mutate({ keyId })}
          >
            Revoke key
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
