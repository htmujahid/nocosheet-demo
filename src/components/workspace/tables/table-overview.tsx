import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { TableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recordsCountQueryOptions } from "@/data/workspace/records";
import { tableQueryOptions } from "@/data/workspace/tables";
import { useAccess } from "@/hooks/use-access";
import { ALL_VIEW } from "@/lib/views/constants";

import { NamedIcon } from "./named-icon";
import { RecentRecords } from "./recent-records";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-4 md:px-6">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-semibold text-2xl tabular-nums">{value}</span>
    </div>
  );
}

export function TableOverview({ workspace, table }: { workspace: string; table: string }) {
  const tableId = Number(table);
  const access = useAccess();
  const { data: info } = useQuery(tableQueryOptions(workspace, tableId));

  // The page is only reached with read access ("all" or "own"). With "own", the count and the
  // recent list are already limited to the user's own records server-side.
  const records = access.scope("read", tableId) === "own" ? "My records" : "All records";
  const { data: counted } = useQuery(recordsCountQueryOptions(workspace, tableId));
  // Counting is capped server-side, so a capped result is shown as "1,000+".
  const recordsLabel = counted
    ? `${counted.count.toLocaleString()}${counted.capped ? "+" : ""}`
    : "—";
  const columnCount = info?.columns?.length;
  const titleColumn =
    info?.columns?.find((column) => column.id === info.titleColumnId)?.columnName ?? null;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <NamedIcon name={info?.icon} fallback={TableIcon} className="size-6" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate font-semibold text-xl">{info?.name ?? "Table"}</h1>
            {info?.description && (
              <p className="text-muted-foreground text-sm">{info.description}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          render={
            <Link
              to="/workspaces/$workspace/tables/$table/views/$view"
              params={{ workspace, table, view: ALL_VIEW }}
            />
          }
        >
          <TableIcon />
          {records}
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-2 divide-x sm:grid-flow-col sm:auto-cols-fr">
          <Stat label={records} value={recordsLabel} />
          <Stat label="Columns" value={columnCount ?? "—"} />
        </div>
      </Card>

      <RecentRecords workspace={workspace} table={table} titleColumn={titleColumn} />
    </div>
  );
}
