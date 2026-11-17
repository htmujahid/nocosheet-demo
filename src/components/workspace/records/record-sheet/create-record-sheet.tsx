import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";

import { type ViewerColumn } from "../columns";
import { useRecordScope } from "../use-record-scope";
import { RecordForm } from "./record-form";
import { useCreateRecord } from "./use-create-record";

function CreateForm({
  workspace,
  tableId,
  tableName,
  columns,
  onCreated,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  columns: ViewerColumn[];
  onCreated: () => void;
}) {
  const { form, create } = useCreateRecord({ workspace, tableId, columns, onCreated });

  return (
    <RecordForm
      form={form}
      workspace={workspace}
      tableId={tableId}
      tableName={tableName}
      columns={columns}
      error={create.error}
    >
      <SheetFooter>
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <Button type="submit" loading={create.isPending}>
          Create record
        </Button>
      </SheetFooter>
    </RecordForm>
  );
}

export function CreateRecordSheet({
  workspace,
  tableId,
  onClose,
}: {
  workspace: string;
  tableId: number;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const scope = useRecordScope(workspace, tableId);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup variant="inset" className="max-w-xl">
        <CreateForm
          workspace={workspace}
          tableId={tableId}
          tableName={scope.tableName}
          columns={scope.columns}
          onCreated={() => setOpen(false)}
        />
      </SheetPopup>
    </Sheet>
  );
}
