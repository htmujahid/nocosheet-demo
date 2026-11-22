import { useMemo, useRef, useState } from "react";

import { useDbClient, useLiveSuspenseQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";

import { UploadIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast";
import { CsvSourceFields } from "@/components/workspace/records/csv-source-fields";
import { useCsvSource } from "@/components/workspace/records/use-csv-source";
import { columnsCollection, createColumnMutationOptions } from "@/data/workspace/columns";
import { tablesCollection } from "@/data/workspace/tables";
import { IMPORT_COLUMN_FORMATS, inferFormat } from "@/lib/records/infer";
import type { ColumnFormat } from "@/lib/tables/formats";
import { defaultOptions } from "@/lib/tables/validation";

import { newColumnDraft } from "./column-draft";
import { FormatSelect } from "./format-select";

type Edit = { name?: string; format?: ColumnFormat; include?: boolean };

function ImportColumnsForm({
  workspace,
  tableId,
  onDone,
}: {
  workspace: string;
  tableId: number;
  onDone: () => void;
}) {
  const dbClient = useDbClient();
  const { data: columns } = useLiveSuspenseQuery((q) =>
    q.from({ column: columnsCollection(tableId) }).orderBy(({ column }) => column.position),
  );
  const [edits, setEdits] = useState<{ key: string; map: Record<number, Edit> }>({
    key: "",
    map: {},
  });
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();
  const [running, setRunning] = useState(false);
  const created = useRef(new Set<number>());

  const csv = useCsvSource(() => {
    created.current = new Set();
    setError(undefined);
  });
  const { headers, rows, hasHeader } = csv;
  const editsKey = `${hasHeader}|${headers.join("\u0000")}`;
  const current = edits.key === editsKey ? edits.map : {};

  const createColumn = useMutation({
    ...createColumnMutationOptions,
    onSuccess: ({ column, table }) => {
      dbClient.collection(columnsCollection(tableId)).utils.writeUpsert(column);
      dbClient.collection(tablesCollection).utils.writeUpsert(table);
    },
  });

  const inferred = useMemo(
    () =>
      headers.map((_, index) => inferFormat(rows.slice(0, 500).map((cells) => cells[index] ?? ""))),
    [headers, rows],
  );

  const drafts = headers.map((header, index) => ({
    index,
    name: current[index]?.name ?? (header.trim() || `Column ${index + 1}`),
    format: current[index]?.format ?? inferred[index],
    include: current[index]?.include ?? true,
  }));
  const active = drafts.filter((draft) => draft.include);

  function edit(index: number, patch: Edit) {
    setEdits({ key: editsKey, map: { ...current, [index]: { ...current[index], ...patch } } });
  }

  const taken = new Set(columns.map((column) => column.name.toLowerCase()));
  const nameIssue = (name: string, index: number) => {
    const trimmed = name.trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length > 64) return "Use 64 characters or fewer";
    if (taken.has(trimmed.toLowerCase())) return "A column with this name already exists";
    if (
      active.some(
        (other) =>
          other.index !== index && other.name.trim().toLowerCase() === trimmed.toLowerCase(),
      )
    )
      return "Two columns share this name";
    return undefined;
  };

  const blocker =
    headers.length === 0
      ? undefined
      : active.length === 0
        ? "Choose at least one column to create."
        : active.some((draft) => nameIssue(draft.name, draft.index))
          ? "Fix the column names marked below."
          : undefined;
  const canRun = headers.length > 0 && !blocker && !running;

  async function run() {
    if (!canRun) return;
    setRunning(true);
    setError(undefined);
    try {
      const base = columns.reduce((max, column) => Math.max(max, column.position), -1) + 1;
      for (const [order, draft] of active.entries()) {
        if (created.current.has(draft.index)) continue;
        setProgress(`Creating column ${order + 1} of ${active.length}`);
        await createColumn.mutateAsync({
          workspace,
          id: tableId,
          column: {
            ...newColumnDraft(),
            name: draft.name.trim(),
            format: draft.format,
            options: defaultOptions(draft.format),
            position: base + order,
          },
        });
        created.current.add(draft.index);
      }
      toastManager.add({
        type: "success",
        title: `Added ${active.length} ${active.length === 1 ? "column" : "columns"}`,
      });
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong");
    } finally {
      setRunning(false);
      setProgress(undefined);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>Import from CSV</SheetTitle>
        <SheetDescription>Create columns from the file's headers.</SheetDescription>
      </SheetHeader>
      <SheetPanel className="flex flex-col gap-6">
        <CsvSourceFields
          csv={csv}
          hint="Column types are guessed from your data. You can change them below."
        />

        {headers.length > 0 && (
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Your data</TableHead>
                <TableHead>Column name</TableHead>
                <TableHead className="min-w-44">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft) => {
                const issue = draft.include ? nameIssue(draft.name, draft.index) : undefined;
                return (
                  <TableRow key={draft.index}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Create a column for ${headers[draft.index] || draft.name}`}
                        checked={draft.include}
                        onCheckedChange={(checked) =>
                          edit(draft.index, { include: checked === true })
                        }
                      />
                    </TableCell>
                    <TableCell className="max-w-40">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium">
                          {headers[draft.index] || "(no name)"}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">
                          {rows[0]?.[draft.index] || "Empty"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Input
                          size="sm"
                          aria-label={`Name for ${headers[draft.index] || draft.name}`}
                          aria-invalid={issue ? true : undefined}
                          disabled={!draft.include}
                          value={draft.name}
                          onChange={(event) => edit(draft.index, { name: event.target.value })}
                        />
                        {issue && (
                          <span className="text-destructive-foreground text-xs">{issue}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <FormatSelect
                        formats={IMPORT_COLUMN_FORMATS}
                        value={draft.format}
                        disabled={!draft.include}
                        onValueChange={(format) => edit(draft.index, { format })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {blocker && (
          <Alert variant="warning">
            <AlertDescription>{blocker}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="error">
            <AlertDescription>
              {error}
              {created.current.size > 0 &&
                " Columns already created are kept; try again to continue."}
            </AlertDescription>
          </Alert>
        )}
      </SheetPanel>
      <SheetFooter>
        <SheetClose render={<Button type="button" variant="ghost" disabled={running} />}>
          Cancel
        </SheetClose>
        <Button type="button" disabled={!canRun} loading={running} onClick={() => void run()}>
          <UploadIcon aria-hidden="true" />
          {progress ??
            `Create ${active.length || ""} ${active.length === 1 ? "column" : "columns"}`}
        </Button>
      </SheetFooter>
    </div>
  );
}

export function ImportColumnsSheet({ workspace, tableId }: { workspace: string; tableId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="outline" />}>
        <UploadIcon />
        Import CSV
      </SheetTrigger>
      <SheetPopup variant="inset" className="max-w-2xl">
        <ImportColumnsForm workspace={workspace} tableId={tableId} onDone={() => setOpen(false)} />
      </SheetPopup>
    </Sheet>
  );
}
