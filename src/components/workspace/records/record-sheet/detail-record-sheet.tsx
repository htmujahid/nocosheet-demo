import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Sheet, SheetPopup } from "@/components/ui/sheet";
import { recordQueryOptions } from "@/data/workspace/records";
import { toFormValues } from "@/lib/records/form";

import { type ViewerColumn, type ViewScope } from "../columns";
import { useRecordScope } from "../use-record-scope";
import { RecordForm } from "./record-form";
import { RecordSheetSkeleton } from "./skeleton";
import { useRecordForm } from "./use-record-form";

function DetailForm({
  workspace,
  tableId,
  tableName,
  recordId,
  record,
  columns,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  recordId: number;
  record: Record<string, unknown>;
  columns: ViewerColumn[];
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
    />
  );
}

export function DetailRecordSheet({
  workspace,
  tableId,
  recordId,
  view,
  onClose,
}: {
  workspace: string;
  tableId: number;
  recordId: number;
  view?: ViewScope;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const scope = useRecordScope(workspace, tableId, view);
  const { data: record, error } = useQuery(recordQueryOptions(workspace, tableId, recordId));

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
            tableName={scope.tableName}
            recordId={recordId}
            record={record}
            columns={scope.columns}
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
