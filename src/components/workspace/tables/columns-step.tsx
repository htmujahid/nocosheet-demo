import { useState } from "react";

import { eq, useDbClient, useLiveSuspenseQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { columnsCollection } from "@/data/workspace/columns";
import {
  deleteTablesMutationOptions,
  tablesCollection,
  updateTableMutationOptions,
} from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { TITLE_FORMATS } from "@/lib/tables/formats";

import { ColumnsEditor } from "./columns-editor";
import { ImportColumnsSheet } from "./import-columns-sheet";
import { TitleSelect } from "./title-select";
import { WizardFooter, WizardPanel } from "./wizard-panel";

export function ColumnsStep({
  tableId,
  onDiscarded,
  onFinished,
}: {
  tableId: number;
  onDiscarded: () => void;
  onFinished: () => void;
}) {
  const dbClient = useDbClient();
  const { id: workspace } = useWorkspace();
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
  const [choice, setChoice] = useState<string | null | undefined>(undefined);

  const updateTable = useMutation({
    ...updateTableMutationOptions,
    onSuccess: (updated) => {
      dbClient.collection(tablesCollection).utils.writeUpsert(updated);
      toastManager.add({ type: "success", title: `${table.name} was created` });
      onFinished();
    },
  });

  const discardTable = useMutation({
    ...deleteTablesMutationOptions,
    onSuccess: () => {
      dbClient.collection(tablesCollection).utils.writeDelete(tableId);
      onDiscarded();
    },
  });

  const titleOptions = columns
    .filter((column) => TITLE_FORMATS.includes(column.format as never))
    .map((column) => ({ value: column.columnName, label: column.name }));
  const savedTitle = columns.find((column) => column.id === table.titleColumnId)?.columnName;
  const firstText = columns.find((column) => column.format === "text")?.columnName;
  const preferred = choice !== undefined ? choice : (savedTitle ?? firstText ?? null);
  const activeTitle = titleOptions.some((option) => option.value === preferred) ? preferred : null;

  const finish = () => {
    if (activeTitle === (savedTitle ?? null)) {
      toastManager.add({ type: "success", title: `${table.name} was created` });
      return onFinished();
    }
    updateTable.mutate({ workspace, id: tableId, values: { titleColumn: activeTitle } });
  };

  const error = updateTable.error ?? discardTable.error;

  return (
    <>
      <WizardPanel
        step={2}
        title="Columns"
        description="Your table already has its id and tracking columns. Each column is saved as soon as you add it."
      >
        <ColumnsEditor
          workspace={workspace}
          tableId={tableId}
          actions={<ImportColumnsSheet workspace={workspace} tableId={tableId} />}
        />
        {titleOptions.length > 0 && (
          <TitleSelect options={titleOptions} value={activeTitle} onValueChange={setChoice} />
        )}
        {error && (
          <Alert variant="error">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </WizardPanel>
      <WizardFooter hint="Finish saves the title column.">
        <Button
          variant="outline"
          onClick={() => discardTable.mutate({ workspace, ids: [tableId] })}
          loading={discardTable.isPending}
          disabled={updateTable.isPending}
        >
          Discard
        </Button>
        <Button onClick={finish} loading={updateTable.isPending} disabled={discardTable.isPending}>
          Finish
        </Button>
      </WizardFooter>
    </>
  );
}
