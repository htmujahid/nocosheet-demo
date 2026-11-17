import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { recordsQueryOptions } from "@/data/workspace/records";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { resolveRecordsQuery } from "@/lib/records/query";
import { systemSortName } from "@/lib/records/sort-param";
import { ALL_VIEW } from "@/lib/views/constants";

type RecordRow = Record<string, unknown>;

const RECENT_SHOWN = 5 as const;

const RECENT_QUERY = {
  ...resolveRecordsQuery({}),
  pageSize: RECENT_SHOWN,
  sort: systemSortName("updated_at"),
  order: "desc" as const,
};

const textOf = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

/** The most recently edited records of a table, newest first; each opens its record sheet. */
export function RecentRecords({
  workspace,
  table,
  titleColumn,
}: {
  workspace: string;
  table: string;
  /** `columnName` of the table's title column, if it has one. */
  titleColumn: string | null;
}) {
  const { data, isPending, error } = useQuery(
    recordsQueryOptions(workspace, Number(table), RECENT_QUERY),
  );
  const rows = (data?.rows ?? []) as RecordRow[];

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Recent records</CardFrameTitle>
        <CardFrameDescription className="min-w-0 truncate">
          The latest changes to this table.
        </CardFrameDescription>
        <CardFrameAction>
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link
                to="/workspaces/$workspace/tables/$table/views/$view"
                params={{ workspace, table, view: ALL_VIEW }}
              />
            }
          >
            View all
          </Button>
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        {isPending ? (
          <div className="flex flex-col gap-3 p-4 md:px-6">
            {Array.from({ length: RECENT_SHOWN }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : error ? (
          <CardPanel className="py-8 text-center text-muted-foreground text-sm">
            The records couldn't be loaded.
          </CardPanel>
        ) : rows.length === 0 ? (
          <CardPanel className="py-8 text-center text-muted-foreground text-sm">
            No records yet.
          </CardPanel>
        ) : (
          rows.map((row) => {
            const id = Number(row.id);
            const title = (titleColumn && textOf(row[titleColumn])) || `Record ${id}`;
            const by = (row.updated_by as { label?: string | null } | null)?.label;
            const at = row.updated_at as number | string | undefined;
            return (
              <Link
                key={id}
                to="/workspaces/$workspace/tables/$table/views/$view/$record"
                params={{ workspace, table, view: ALL_VIEW, record: String(id) }}
                className="flex items-center gap-3 p-4 transition-colors not-last:border-b hover:bg-accent/40 md:px-6"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-sm">{title}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    <span className="font-mono">#{id}</span>
                    {by && ` · Updated by ${by}`}
                  </span>
                </div>
                {at !== undefined && (
                  <span
                    className="shrink-0 text-muted-foreground text-xs"
                    title={new Date(at).toLocaleString()}
                  >
                    {formatRelativeTime(at)}
                  </span>
                )}
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })
        )}
      </Card>
    </CardFrame>
  );
}
