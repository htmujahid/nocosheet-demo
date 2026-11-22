import { useState } from "react";

import { RefreshCwIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
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
import { useSession } from "@/hooks/use-session";
import { resetDbClient } from "@/lib/db/client";

export function ClearCacheCard({ workspace }: { workspace: string }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const clear = async () => {
    setClearing(true);
    await resetDbClient(session!.user.id, workspace);
    window.location.assign(`/workspaces/${workspace}`);
  };

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Local cache</CardFrameTitle>
        <CardFrameDescription>Data stored in this browser for offline use.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Clear local cache"
          description="Delete the copy of tables and records held in this browser and download them again from the server. Nothing on the server changes. Use this if cached data looks out of date."
        >
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={
                <Button variant="outline" className="self-start">
                  <RefreshCwIcon />
                  Clear local cache
                </Button>
              }
            />
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear the local cache?</AlertDialogTitle>
                <AlertDialogDescription>
                  The tables and records cached in this browser are removed and re-downloaded from
                  the server. Server data is untouched. Any changes made offline that have not
                  synced yet will be discarded.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
                <Button loading={clearing} onClick={clear}>
                  Clear cache
                </Button>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
