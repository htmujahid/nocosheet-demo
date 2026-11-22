import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTable } from "@tanstack/react-table";

import { useQueryStates } from "nuqs";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { dataTableFeatures } from "@/components/shared/data-table/features";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter } from "@/components/ui/frame";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auditQueryOptions } from "@/data/workspace/audit";
import { tablesCollection } from "@/data/workspace/tables";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { auditSearchParams, type AuditQuery } from "@/lib/audit/query";
import { AUDIT_RETENTION_DAYS } from "@/lib/audit/retention";

import { auditColumns } from "./audit-log-columns";

export type AuditRow = NonNullable<ReturnType<typeof useAuditRows>["data"]>["rows"][number];

function useAuditRows(workspace: string, query: AuditQuery) {
  return useQuery({ ...auditQueryOptions(workspace, query), placeholderData: keepPreviousData });
}

const ALL = "all";

const ACTION_ITEMS = [
  { value: ALL, label: "All actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Edited" },
  { value: "delete", label: "Deleted" },
  { value: "restore", label: "Restored" },
  { value: "import", label: "Imported" },
];

const FIRST_PAGE = { cursor: null, dir: "next" } as const;

export function SettingsAuditLog({ workspace }: { workspace: string }) {
  const [query, setQuery] = useQueryStates(auditSearchParams, { history: "replace" });
  const onQueryChange = (patch: Partial<AuditQuery>) => void setQuery(patch);
  const { data, isFetching } = useAuditRows(workspace, query);
  const rows = data?.rows ?? [];
  const { data: tables } = useLiveSuspenseQuery({
    query: (q) =>
      q
        .from({ table: tablesCollection })
        .orderBy(({ table }) => table.position)
        .orderBy(({ table }) => table.id),
  });

  const tableItems = [
    { value: ALL, label: "All tables" },
    ...tables.map((table) => ({ value: String(table.id), label: table.name })),
  ];

  const table = useTable(
    {
      features: dataTableFeatures,
      columns: auditColumns,
      data: rows,
      getRowId: (row) => String(row.id),
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
    },
    (state) => ({ columnVisibility: state.columnVisibility }),
  );

  const filtered = query.table !== null || query.action !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={query.table === null ? ALL : String(query.table)}
            items={tableItems}
            onValueChange={(value) =>
              onQueryChange({ ...FIRST_PAGE, table: value === ALL ? null : Number(value) })
            }
          >
            <SelectTrigger aria-label="Filter by table" size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {tableItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <Select
            value={query.action ?? ALL}
            items={ACTION_ITEMS}
            onValueChange={(value) =>
              onQueryChange({
                ...FIRST_PAGE,
                action: AUDIT_ACTIONS.find((item) => item === value) ?? null,
              })
            }
          >
            <SelectTrigger aria-label="Filter by action" size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {ACTION_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <Frame>
        <DataTable
          table={table}
          pending={isFetching}
          empty={
            filtered
              ? "No entries match these filters."
              : "Nothing recorded yet. Turn on Audit changes in a table's definition to start."
          }
        />
        <FrameFooter className="flex items-center justify-between gap-2 p-2">
          <p className="text-muted-foreground text-sm">
            Entries are kept for {AUDIT_RETENTION_DAYS} days.
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={!data?.prevCursor}
                      onClick={() =>
                        onQueryChange({ cursor: data?.prevCursor ?? null, dir: "prev" })
                      }
                      size="sm"
                      variant="outline"
                    />
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={!data?.nextCursor}
                      onClick={() =>
                        onQueryChange({ cursor: data?.nextCursor ?? null, dir: "next" })
                      }
                      size="sm"
                      variant="outline"
                    />
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </FrameFooter>
      </Frame>
    </div>
  );
}
