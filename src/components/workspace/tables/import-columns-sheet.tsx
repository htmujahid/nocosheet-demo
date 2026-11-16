import { useMemo, useRef, useState } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

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
import { workspaceKeys } from "@/data/workspace/keys";
import { importRecordsMutationOptions } from "@/data/workspace/records";
import { createColumnMutationOptions, tableQueryOptions } from "@/data/workspace/tables";
import { convertCell, MAX_IMPORT_ROWS } from "@/lib/records/import";
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
  const queryClient = useQueryClient();
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const [edits, setEdits] = useState<{ key: string; map: Record<number, Edit> }>({
    key: "",
    map: {},
  });
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();
  const [running, setRunning] = useState(false);
  const created = useRef(new Map<number, string>());
  const imported = useRef(0);

  const csv = useCsvSource(() => {
    created.current = new Map();
    imported.current = 0;
    setError(undefined);
  });
  const { headers, rows, hasHeader } = csv;
  const editsKey = `${hasHeader}|${headers.join("\u0000")}`;
  const current = edits.key === editsKey ? edits.map : {};

  const createColumn = useMutation(createColumnMutationOptions);
  const importRecords = useMutation(importRecordsMutationOptions);

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

  const taken = new Set(table.columns.map((column) => column.name.toLowerCase()));
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

  const dataIssues = new Map<number, string>();
  for (const draft of active) {
    const column = { format: draft.format, options: defaultOptions(draft.format) };
    for (const cells of rows) {
      const converted = convertCell(column, cells[draft.index] ?? "");
      if (converted && !converted.ok) {
        dataIssues.set(draft.index, converted.message);
        break;
      }
    }
  }

  const blocker =
    headers.length === 0
      ? undefined
      : active.length === 0
        ? "Choose at least one column to create."
        : active.some((draft) => nameIssue(draft.name, draft.index))
          ? "Fix the column names marked below."
          : dataIssues.size > 0
            ? "Some values don't fit their column type. Change the type or leave the column out."
            : undefined;
  const canRun = headers.length > 0 && !blocker && !running;

  async function run() {
    if (!canRun) return;
    setRunning(true);
    setError(undefined);
    try {
      const base = table.columns.reduce((max, column) => Math.max(max, column.position), -1) + 1;
      for (const [order, draft] of active.entries()) {
        if (created.current.has(draft.index)) continue;
        setProgress(`Creating column ${order + 1} of ${active.length}`);
        const column = await createColumn.mutateAsync({
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
        created.current.set(draft.index, column.columnName);
      }

      const payload = rows.map((cells) =>
        Object.fromEntries(
          active.map((draft) => [created.current.get(draft.index)!, cells[draft.index] ?? ""]),
        ),
      );
      while (imported.current < payload.length) {
        setProgress(
          `Importing records ${imported.current + 1}–${Math.min(imported.current + MAX_IMPORT_ROWS, payload.length)} of ${payload.length}`,
        );
        const result = await importRecords.mutateAsync({
          workspace,
          tableId,
          rows: payload.slice(imported.current, imported.current + MAX_IMPORT_ROWS),
        });
        if (result.failed > 0) {
          const first = result.errors[0];
          throw new Error(
            `Row ${imported.current + (first?.row ?? 1)}: ${first?.message ?? "The records couldn't be imported."}`,
          );
        }
        imported.current += result.created;
      }

      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
      toastManager.add({
        type: "success",
        title: `Added ${active.length} ${active.length === 1 ? "column" : "columns"} and ${payload.length} ${payload.length === 1 ? "record" : "records"}`,
      });
      onDone();
    } catch (failure) {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
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
        <SheetDescription>
          Create columns from the file's headers, then import its rows as records.
        </SheetDescription>
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
                const dataIssue = draft.include ? dataIssues.get(draft.index) : undefined;
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
                      <div className="flex flex-col gap-1">
                        <FormatSelect
                          formats={IMPORT_COLUMN_FORMATS}
                          value={draft.format}
                          disabled={!draft.include}
                          onValueChange={(format) => edit(draft.index, { format })}
                        />
                        {dataIssue && (
                          <span className="text-destructive-foreground text-xs">{dataIssue}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {headers.length > 0 && rows.length === 0 && (
          <Alert variant="warning">
            <AlertDescription>
              The data has no records, so only columns will be created.
            </AlertDescription>
          </Alert>
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
            `Create ${active.length || ""} ${active.length === 1 ? "column" : "columns"}${rows.length > 0 ? ` & import ${rows.length}` : ""}`}
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
