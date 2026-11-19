import { useOptimistic, useState, useTransition } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { PlusIcon } from "lucide-react";

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
import { workspaceKeys } from "@/data/workspace/keys";
import {
  createColumnMutationOptions,
  deleteColumnMutationOptions,
  reorderColumnsMutationOptions,
  tableQueryOptions,
  updateColumnMutationOptions,
} from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

import { ColumnDialog } from "./column-dialog";
import { columnToDraft, type ColumnDraft } from "./column-draft";
import { ColumnsList } from "./columns-list";

function useTableData(workspace: string, tableId: number) {
  return useSuspenseQuery(tableQueryOptions(workspace, tableId));
}

type EditorColumn = ReturnType<typeof useTableData>["data"]["columns"][number];

export function ColumnsEditor({
  workspace,
  tableId,
  actions,
}: {
  workspace: string;
  tableId: number;
  actions?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data: table } = useTableData(workspace, tableId);
  const [columns, setColumns] = useOptimistic(
    table.columns,
    (_current, next: EditorColumn[]) => next,
  );
  const [, startTransition] = useTransition();

  const [dialog, setDialog] = useState<{ open: boolean; column: EditorColumn | null; key: number }>(
    { open: false, column: null, key: 0 },
  );
  const [removing, setRemoving] = useState<EditorColumn | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });

  const createColumn = useMutation({ ...createColumnMutationOptions, onSuccess: refresh });
  const updateColumn = useMutation({ ...updateColumnMutationOptions, onSuccess: refresh });
  const deleteColumn = useMutation({
    ...deleteColumnMutationOptions,
    onSuccess: async () => {
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({ queryKey: workspaceKeys.columnsTrash(tableId) }),
      ]);
      setRemoving(null);
    },
  });

  const reorderColumns = useMutation({
    ...reorderColumnsMutationOptions,
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't reorder the columns",
        description: error.message,
      }),
    onSettled: refresh,
  });

  const reorder = (next: EditorColumn[]) =>
    startTransition(async () => {
      setColumns(next);
      await reorderColumns
        .mutateAsync({ workspace, id: tableId, ids: next.map((column) => column.id) })
        .catch(() => undefined);
    });

  const openDialog = (column: EditorColumn | null) =>
    setDialog((current) => ({ open: true, column, key: current.key + 1 }));

  const nextPosition = columns.reduce((max, column) => Math.max(max, column.position), -1) + 1;

  const save = async (draft: ColumnDraft) => {
    if (dialog.column) {
      await updateColumn.mutateAsync({
        workspace,
        id: tableId,
        columnId: dialog.column.id,
        patch: {
          name: draft.name,
          description: draft.description,
          icon: draft.icon,
          isRequired: draft.isRequired,
          isFilterable: draft.isFilterable,
          isSortable: draft.isSortable,
          isSearchable: draft.isSearchable,
          isHidden: draft.isHidden,
        },
      });
    } else {
      await createColumn.mutateAsync({
        workspace,
        id: tableId,
        column: { ...draft, position: nextPosition },
      });
    }
  };

  const others = columns.filter((column) => column.id !== dialog.column?.id);
  const taken = others.map((column) => column.name.toLowerCase());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {columns.length} {columns.length === 1 ? "column" : "columns"}
        </p>
        <div className="flex items-center gap-2">
          {actions}
          <Button size="sm" onClick={() => openDialog(null)}>
            <PlusIcon />
            Add column
          </Button>
        </div>
      </div>

      <ColumnsList
        columns={columns}
        titleColumnId={table.titleColumnId}
        empty="No columns yet. Add the columns that hold your data."
        onEdit={openDialog}
        onDelete={setRemoving}
        onReorder={reorder}
      />

      <ColumnDialog
        formKey={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        initial={dialog.column ? columnToDraft(dialog.column) : null}
        taken={taken}
        onSave={save}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
            deleteColumn.reset();
          }
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The column is removed from the table. If the table has records, its values are kept in
              Deleted columns and it can be restored for {TRASH_RETENTION_DAYS} days before it is
              deleted for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteColumn.error && (
            <div className="px-6 pb-2">
              <Alert variant="error">
                <AlertDescription>{deleteColumn.error.message}</AlertDescription>
              </Alert>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              loading={deleteColumn.isPending}
              onClick={() =>
                removing && deleteColumn.mutate({ workspace, id: tableId, columnId: removing.id })
              }
            >
              Delete column
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
