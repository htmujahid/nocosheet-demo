import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { RotateCcwIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
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
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetWorkspaceMutationOptions } from "@/data/workspace/reset";
import { useSession } from "@/hooks/use-session";
import { useWorkspace } from "@/hooks/use-workspace";
import { resetDbClient } from "@/lib/db/client";

const CONFIRMATION = "reset";

export function ResetWorkspaceCard({ workspace }: { workspace: string }) {
  const { isAdmin } = useWorkspace();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const reset = useMutation({
    ...resetWorkspaceMutationOptions,
    onSuccess: async () => {
      setOpen(false);
      await resetDbClient(session!.user.id, workspace);
      window.location.assign(`/workspaces/${workspace}`);
    },
  });

  if (!isAdmin) return null;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Danger zone</CardFrameTitle>
        <CardFrameDescription>Actions here can't be undone.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Reset workspace"
          description="Delete every table, record, view, favorite, trash entry and audit log entry. Accounts, members and access profiles are kept."
        >
          <AlertDialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                setTyped("");
                reset.reset();
              }
            }}
          >
            <AlertDialogTrigger
              render={
                <Button variant="destructive-outline" className="self-start">
                  <RotateCcwIcon />
                  Reset workspace
                </Button>
              }
            />
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset this workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every table and all of its records, columns and views are deleted permanently,
                  along with the trash and the audit log. Accounts and access profiles are kept, but
                  grants on specific tables are removed with them.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-3 px-6 pb-2">
                <label className="text-sm" htmlFor="reset-confirmation">
                  Type <strong>{CONFIRMATION}</strong> to confirm.
                </label>
                <Input
                  id="reset-confirmation"
                  autoComplete="off"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                />
                {reset.error && (
                  <Alert variant="error">
                    <AlertDescription>{reset.error.message}</AlertDescription>
                  </Alert>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
                <Button
                  variant="destructive"
                  disabled={typed.trim().toLowerCase() !== CONFIRMATION}
                  loading={reset.isPending}
                  onClick={() => reset.mutate({ workspace })}
                >
                  Reset workspace
                </Button>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
