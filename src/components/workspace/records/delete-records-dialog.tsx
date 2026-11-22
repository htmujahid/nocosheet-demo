import { useState } from "react";

import { TrashIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCreateHandle,
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

import { useRecordWrites } from "./use-record-writes";

export type DeleteRecordsPayload = { ids: number[] };

export const createDeleteRecordsHandle = () => AlertDialogCreateHandle<DeleteRecordsPayload>();

type DeleteRecordsProps = {
  workspace: string;
  tableId: number;
  onDeleted: (count: number) => void;
};

function DeleteRecordsPopup({
  tableId,
  ids,
  onDeleted,
  onClose,
}: DeleteRecordsProps & { ids: number[]; onClose: () => void }) {
  const writes = useRecordWrites(tableId);
  const count = ids.length;
  const noun = count === 1 ? "record" : "records";

  const deleteRecords = () => {
    writes.remove(ids);
    onClose();
    onDeleted(count);
    toastManager.add({ type: "success", title: `${count} ${noun} moved to trash` });
  };

  return (
    <AlertDialogPopup>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Delete {count} {noun}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          The selected {noun} will move to the trash, where you can restore{" "}
          {count === 1 ? "it" : "them"}.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
        <Button variant="destructive" onClick={deleteRecords}>
          Delete {noun}
        </Button>
      </AlertDialogFooter>
    </AlertDialogPopup>
  );
}

export function DeleteRecordsDialog({
  label,
  ids,
  ...props
}: DeleteRecordsProps & { ids: number[]; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
        <TrashIcon />
        {label ?? `Delete ${ids.length}`}
      </AlertDialogTrigger>
      <DeleteRecordsPopup {...props} ids={ids} onClose={() => setOpen(false)} />
    </AlertDialog>
  );
}

export function DetachedDeleteRecordsDialog({
  handle,
  ...props
}: DeleteRecordsProps & { handle: ReturnType<typeof createDeleteRecordsHandle> }) {
  return (
    <AlertDialog handle={handle}>
      {({ payload }) => (
        <DeleteRecordsPopup {...props} ids={payload?.ids ?? []} onClose={() => handle.close()} />
      )}
    </AlertDialog>
  );
}
