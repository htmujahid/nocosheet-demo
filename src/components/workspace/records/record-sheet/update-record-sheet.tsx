import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";
import { toastManager } from "@/components/ui/toast";
import { buildPatch, toFormValues, type FormValues } from "@/lib/records/form";

import { type ViewerColumn, type ViewScope } from "../columns";
import { DeleteRecordsDialog } from "../delete-records-dialog";
import { useRecord } from "../grid/use-record-rows";
import { useRecordScope } from "../use-record-scope";
import { useRecordWrites } from "../use-record-writes";
import { RecordForm } from "./record-form";
import { RecordSheetSkeleton } from "./skeleton";
import { useRecordForm } from "./use-record-form";

function UpdateForm({
  workspace,
  tableId,
  tableName,
  recordId,
  record,
  columns,
  canDelete,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  recordId: number;
  record: Record<string, unknown>;
  columns: ViewerColumn[];
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const writes = useRecordWrites(tableId);
  const [initial, setInitial] = useState<FormValues>(() => toFormValues(columns, record));

  const form = useRecordForm({
    initial,
    validate: (value) => buildPatch(columns, value, initial).errors,
    onSubmit: (value) => {
      const { patch } = buildPatch(columns, value, initial);
      if (Object.keys(patch).length === 0) return;
      writes.update(recordId, patch);
      setInitial(value);
      form.reset(value);
      toastManager.add({ type: "success", title: "Record saved" });
    },
  });

  return (
    <RecordForm
      form={form}
      workspace={workspace}
      tableId={tableId}
      tableName={tableName}
      columns={columns}
      record={record}
      recordId={recordId}
    >
      <SheetFooter>
        {canDelete && (
          <div className="me-auto">
            <DeleteRecordsDialog
              workspace={workspace}
              tableId={tableId}
              ids={[recordId]}
              label="Delete"
              onDeleted={onDeleted}
            />
          </div>
        )}
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <form.Subscribe selector={(state) => state.isDirty}>
          {(dirty) => (
            <Button type="submit" disabled={!dirty}>
              Save changes
            </Button>
          )}
        </form.Subscribe>
      </SheetFooter>
    </RecordForm>
  );
}

export function UpdateRecordSheet({
  workspace,
  tableId,
  recordId,
  view,
  canDelete = true,
  onClose,
}: {
  workspace: string;
  tableId: number;
  recordId: number;
  view?: ViewScope;
  canDelete?: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const scope = useRecordScope(workspace, tableId, view);
  const { record, ready } = useRecord(tableId, recordId, scope.columns);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup variant="inset" className="max-w-xl">
        {record ? (
          <UpdateForm
            key={recordId}
            workspace={workspace}
            tableId={tableId}
            tableName={scope.tableName}
            recordId={recordId}
            record={record}
            columns={scope.columns}
            canDelete={canDelete}
            onDeleted={() => setOpen(false)}
          />
        ) : (
          <RecordSheetSkeleton
            title={`Record ${recordId}`}
            tableName={scope.tableName}
            error={ready ? new Error("This record doesn't exist or was deleted.") : null}
          />
        )}
      </SheetPopup>
    </Sheet>
  );
}
