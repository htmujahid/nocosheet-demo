import { useState } from "react";

import { eq, useDbClient, useLiveSuspenseQuery } from "@tanstack/react-db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";
import { toastManager } from "@/components/ui/toast";
import { columnsCollection } from "@/data/workspace/columns";
import { workspaceKeys } from "@/data/workspace/keys";
import { recordsCollection } from "@/data/workspace/records";
import { tablesCollection } from "@/data/workspace/tables";
import { restoreRecord, trashEntryQueryOptions } from "@/data/workspace/trash";
import { ApiError } from "@/lib/api-error";
import { buildCreate, buildPatch, toFormValues } from "@/lib/records/form";

import { buildViewerColumns, type ViewerColumn } from "../columns";
import { RecordForm } from "./record-form";
import { RecordSheetSkeleton } from "./skeleton";
import { useRecordForm } from "./use-record-form";

function RestoreForm({
  workspace,
  tableId,
  tableName,
  recordId,
  record,
  columns,
  onRestored,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  recordId: number;
  record: Record<string, unknown>;
  columns: ViewerColumn[];
  onRestored: () => void;
}) {
  const queryClient = useQueryClient();
  const [initial] = useState(() => toFormValues(columns, record));
  const dbClient = useDbClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const restore = useMutation({
    mutationKey: workspaceKeys.mutation("restore-record"),
    mutationFn: (values: Record<string, unknown>) =>
      restoreRecord({ workspace, tableId, recordId, values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.recordsTrash(tableId) });
      await dbClient
        .collection(recordsCollection(tableId))
        .utils.pull()
        .catch(() => undefined);
      toastManager.add({ type: "success", title: "Record restored" });
      onRestored();
    },
    onError: (error) =>
      setFieldErrors(
        error instanceof ApiError && error.field ? { [error.field]: error.message } : {},
      ),
  });

  const form = useRecordForm({
    initial,
    validate: (value) => buildCreate(columns, value).errors,
    onSubmit: (value) => {
      setFieldErrors({});
      restore.mutate(buildPatch(columns, value, initial).patch);
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
      recordId={Number(record.id)}
      status="In trash"
      error={restore.error}
      fieldErrors={fieldErrors}
      onFieldEdit={(key) =>
        setFieldErrors((current) => {
          if (!(key in current)) return current;
          const { [key]: _removed, ...rest } = current;
          return rest;
        })
      }
    >
      <SheetFooter>
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <Button type="submit" loading={restore.isPending}>
          Restore record
        </Button>
      </SheetFooter>
    </RecordForm>
  );
}

export function RestoreRecordSheet({
  workspace,
  tableId,
  recordId,
  onClose,
}: {
  workspace: string;
  tableId: number;
  recordId: number;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const { data: table } = useLiveSuspenseQuery((q) =>
    q
      .from({ table: tablesCollection })
      .where(({ table }) => eq(table.id, tableId))
      .findOne(),
  );
  if (!table) throw notFound();
  const { data: columns } = useLiveSuspenseQuery((q) =>
    q.from({ column: columnsCollection(tableId) }).orderBy(({ column }) => column.position),
  );
  const { data: entry, error } = useQuery(trashEntryQueryOptions(workspace, tableId, recordId));

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup variant="inset" className="max-w-xl">
        {entry ? (
          <RestoreForm
            key={recordId}
            workspace={workspace}
            tableId={tableId}
            tableName={table.name}
            recordId={recordId}
            record={entry.record}
            columns={buildViewerColumns({ titleColumnId: table.titleColumnId, columns })}
            onRestored={() => setOpen(false)}
          />
        ) : (
          <RecordSheetSkeleton title="Restore record" tableName={table.name} error={error} />
        )}
      </SheetPopup>
    </Sheet>
  );
}
