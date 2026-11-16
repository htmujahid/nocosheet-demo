import { useMemo, useState } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { UploadIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FrameDescription, FrameHeader, FrameTitle } from "@/components/ui/frame";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
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
import { workspaceKeys } from "@/data/workspace/keys";
import { importRecordsMutationOptions } from "@/data/workspace/records";
import { tableQueryOptions } from "@/data/workspace/tables";
import {
  convertCell,
  type ImportResult,
  isImportableFormat,
  matchHeaders,
  MAX_IMPORT_ROWS,
} from "@/lib/records/import";

import { buildViewerColumns } from "./columns";
import { CsvSourceFields } from "./csv-source-fields";
import { useCsvSource } from "./use-csv-source";

const SKIP = "__skip";
const PREVIEW_ROWS = 20;
const PREVIEW_COLUMNS = 20;

function ImportForm({
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
  const allColumns = buildViewerColumns(table);
  const columns = allColumns.filter(
    (column) => !column.readOnly && isImportableFormat(column.format),
  );
  const ignored = new Set(
    allColumns
      .filter((column) => column.readOnly || !isImportableFormat(column.format))
      .flatMap((column) => [column.name.toLowerCase(), column.key.toLowerCase()]),
  );

  const [overrides, setOverrides] = useState<{ key: string; map: Record<number, string | null> }>({
    key: "",
    map: {},
  });
  const [result, setResult] = useState<ImportResult>();

  const csv = useCsvSource(resetResult);
  const { grid, headers, rows, hasHeader } = csv;
  const headersKey = `${hasHeader}|${headers.join("\u0000")}`;

  const auto = useMemo(
    () => (hasHeader ? matchHeaders(headers, columns) : headers.map(() => null)),
    [headers, hasHeader, columns],
  );
  const mapping = headers.map((_, index) =>
    overrides.key === headersKey && index in overrides.map ? overrides.map[index] : auto[index],
  );
  const mapped = mapping.filter((key): key is string => key !== null);
  const byKey = new Map(columns.map((column) => [column.key, column]));

  const importRecords = useMutation({
    ...importRecordsMutationOptions,
    onSuccess: async (data) => {
      setResult(data);
      if (data.failed > 0) return;
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.table(tableId),
        predicate: (query) => query.queryKey[3] !== "record",
      });
      toastManager.add({
        type: "success",
        title: `Imported ${data.created} ${data.created === 1 ? "record" : "records"}`,
      });
      onDone();
    },
  });

  function resetResult() {
    setResult(undefined);
    importRecords.reset();
  }

  const preview = useMemo(() => {
    const issues = new Map<string, string>();
    let count = 0;
    rows.forEach((cells, rowIndex) => {
      mapping.forEach((key, index) => {
        const column = key ? byKey.get(key) : undefined;
        if (!column) return;
        const cell = cells[index] ?? "";
        const converted = convertCell(column, cell);
        const message =
          converted && !converted.ok
            ? converted.message
            : converted === null && column.required && column.defaultValue === null
              ? "This field is required"
              : undefined;
        if (!message) return;
        count++;
        if (rowIndex < PREVIEW_ROWS) issues.set(`${rowIndex}:${index}`, message);
      });
    });
    return { issues, count };
  }, [rows, mapping.join("|"), table]);

  const shown = mapping
    .flatMap((key, index) => (key && byKey.has(key) ? [{ index, column: byKey.get(key)! }] : []))
    .slice(0, PREVIEW_COLUMNS);

  const duplicated = mapped.find((key, index) => mapped.indexOf(key) !== index);
  const missing = columns.filter(
    (column) => column.required && column.defaultValue === null && !mapped.includes(column.key),
  );
  const blocker =
    grid.length === 0
      ? undefined
      : rows.length === 0
        ? "The data has no records to import."
        : rows.length > MAX_IMPORT_ROWS
          ? `Import up to ${MAX_IMPORT_ROWS} records at a time.`
          : mapped.length === 0
            ? "Map at least one column."
            : duplicated
              ? `More than one column is mapped to ${byKey.get(duplicated)?.name}.`
              : missing.length
                ? `Map the required ${missing.length === 1 ? "column" : "columns"}: ${missing.map((column) => column.name).join(", ")}.`
                : undefined;
  const canImport = rows.length > 0 && !blocker;

  const items = [
    { value: SKIP, label: "Don't import" },
    ...columns.map((column) => ({ value: column.key, label: column.name })),
  ];

  function submit() {
    if (!canImport || importRecords.isPending) return;
    const payload = rows.map((cells) =>
      Object.fromEntries(
        mapping.flatMap((key, index) => (key ? [[key, cells[index] ?? ""] as const] : [])),
      ),
    );
    importRecords.mutate({ workspace, tableId, rows: payload });
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      }}
    >
      <SheetHeader>
        <SheetTitle>Import records</SheetTitle>
        <SheetDescription>
          Add records to {table.name} from a CSV file, or paste the data.
        </SheetDescription>
      </SheetHeader>
      <SheetPanel className="flex flex-col gap-6">
        <CsvSourceFields csv={csv} hint="Dates use YYYY-MM-DD. Link columns take record IDs." />

        {grid.length > 0 && (
          <>
            <Frame>
              <FrameHeader>
                <FrameTitle>Match columns</FrameTitle>
                <FrameDescription>
                  Choose where each part of your data goes. Columns set to "Don't import" are left
                  out.
                </FrameDescription>
              </FrameHeader>
              <Table variant="card">
                <TableHeader>
                  <TableRow>
                    <TableHead>Your data</TableHead>
                    <TableHead>Import into</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header, index) =>
                    mapping[index] === null && ignored.has(header.trim().toLowerCase()) ? null : (
                      <TableRow key={`${header}-${index}`}>
                        <TableCell className="max-w-48">
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="truncate font-medium">{header || "(no name)"}</span>
                            <span className="truncate text-muted-foreground text-xs">
                              {rows[0]?.[index] || "Empty"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-44">
                          <Select
                            value={mapping[index] ?? SKIP}
                            items={items}
                            onValueChange={(next) =>
                              setOverrides({
                                key: headersKey,
                                map: {
                                  ...(overrides.key === headersKey ? overrides.map : {}),
                                  [index]: next === SKIP ? null : String(next),
                                },
                              })
                            }
                          >
                            <SelectTrigger aria-label={`Column for ${header}`} size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectPopup>
                              {items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectPopup>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </Frame>

            {blocker && (
              <Alert variant="warning">
                <AlertDescription>{blocker}</AlertDescription>
              </Alert>
            )}

            {shown.length > 0 && (
              <Frame>
                <FrameHeader>
                  <div className="flex items-center gap-2">
                    <FrameTitle>Preview</FrameTitle>
                    {preview.count > 0 ? (
                      <Badge variant="error">Data incompatible</Badge>
                    ) : (
                      <Badge variant="success">Ready to import</Badge>
                    )}
                  </div>
                  <FrameDescription>
                    {rows.length} {rows.length === 1 ? "record" : "records"} will be added.
                    {preview.count > 0 &&
                      ` ${preview.count} ${preview.count === 1 ? "value doesn't" : "values don't"} fit and will be rejected.`}{" "}
                    Showing the first {PREVIEW_ROWS} rows and {PREVIEW_COLUMNS} columns.
                  </FrameDescription>
                </FrameHeader>
                <Table variant="card">
                  <TableHeader>
                    <TableRow>
                      {shown.map(({ index, column }) => (
                        <TableHead key={index}>{column.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, PREVIEW_ROWS).map((cells, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {shown.map(({ index }) => {
                          const issue = preview.issues.get(`${rowIndex}:${index}`);
                          return (
                            <TableCell
                              key={index}
                              title={issue}
                              className={issue ? "text-destructive-foreground" : undefined}
                            >
                              {cells[index] || <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Frame>
            )}
          </>
        )}

        {importRecords.error && (
          <Alert variant="error">
            <AlertDescription>{importRecords.error.message}</AlertDescription>
          </Alert>
        )}
        {result && result.failed > 0 && (
          <Alert variant="error">
            <AlertTitle>
              Nothing was imported: {result.failed}{" "}
              {result.failed === 1 ? "record has" : "records have"} problems
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc ps-4">
                {result.errors.map((error) => (
                  <li key={error.row}>
                    Row {error.row}: {error.message}
                  </li>
                ))}
                {result.failed > result.errors.length && (
                  <li>and {result.failed - result.errors.length} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </SheetPanel>
      <SheetFooter>
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <Button
          type="button"
          disabled={!canImport}
          loading={importRecords.isPending}
          onClick={submit}
        >
          <UploadIcon aria-hidden="true" />
          Import {rows.length > 0 ? rows.length : ""}
          <Kbd className="max-sm:hidden">Ctrl ↵</Kbd>
        </Button>
      </SheetFooter>
    </div>
  );
}

export function ImportRecordsSheet({
  workspace,
  tableId,
  onClose,
}: {
  workspace: string;
  tableId: number;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup variant="inset" className="max-w-2xl">
        <ImportForm workspace={workspace} tableId={tableId} onDone={() => setOpen(false)} />
      </SheetPopup>
    </Sheet>
  );
}
