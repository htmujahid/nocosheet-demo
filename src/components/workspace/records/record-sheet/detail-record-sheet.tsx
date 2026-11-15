import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";
import { recordQueryOptions } from "@/data/workspace/records";
import { toFormValues } from "@/lib/records/form";

import { type ViewerColumn, type ViewScope } from "../columns";
import { DeleteRecordsDialog } from "../delete-records-dialog";
import { useRecordScope } from "../use-record-scope";
import { RecordForm } from "./record-form";
import { RecordSheetSkeleton } from "./skeleton";
import { useRecordForm } from "./use-record-form";

function DetailForm({
  workspace,
  tableId,
  viewId,
  tableName,
  recordId,
  record,
  columns,
  canDelete,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  viewId?: number;
  tableName: string;
  recordId: number;
  record: Record<string, unknown>;
  columns: ViewerColumn[];
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const form = useRecordForm({ initial: toFormValues(columns, record) });

  return (
    <RecordForm
      form={form}
      workspace={workspace}
      tableId={tableId}
      tableName={tableName}
      columns={columns}
      record={record}
      recordId={recordId}
      disabled
      status="View only"
    >
      {canDelete && (
        <SheetFooter>
          <div className="me-auto">
            <DeleteRecordsDialog
              workspace={workspace}
              tableId={tableId}
              viewId={viewId}
              ids={[recordId]}
              label="Delete"
              onDeleted={onDeleted}
            />
          </div>
          <SheetClose render={<Button type="button" variant="ghost" />}>Close</SheetClose>
        </SheetFooter>
      )}
    </RecordForm>
  );
}

export function DetailRecordSheet({
  workspace,
  tableId,
  recordId,
  view,
  canDelete = false,
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
  const { data: record, error } = useQuery(
    recordQueryOptions(workspace, tableId, recordId, view?.id),
  );

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
          <DetailForm
            key={recordId}
            workspace={workspace}
            tableId={tableId}
            viewId={view?.id}
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
            error={error}
          />
        )}
      </SheetPopup>
    </Sheet>
  );
}
