import { Link } from "@tanstack/react-router";

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
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import type { TableRow } from "@/data/workspace/tables";
import { useAccess } from "@/hooks/use-access";
import { formatRelativeTime } from "@/lib/format-relative-time";

const RECENT_SHOWN = 5;

export function TableShortcuts({
  workspace,
  tables: allTables,
}: {
  workspace: string;
  tables: TableRow[];
}) {
  const access = useAccess();
  const tables = [...allTables].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const empty = tables.length === 0;

  return (
    <>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Recent tables</CardFrameTitle>
          <CardFrameDescription>Jump back into what changed last.</CardFrameDescription>
          {access.admin && !empty && (
            <CardFrameAction>
              <Button
                variant="ghost"
                size="sm"
                render={<Link to="/workspaces/$workspace/tables" params={{ workspace }} />}
              >
                View all
              </Button>
            </CardFrameAction>
          )}
        </CardFrameHeader>
        <Card>
          {tables.slice(0, RECENT_SHOWN).map((table) => (
            <Link
              key={table.id}
              to="/workspaces/$workspace/tables/$table"
              params={{ workspace, table: String(table.id) }}
              className="flex items-center gap-3 p-4 transition-colors not-last:border-b hover:bg-accent/40 md:px-6"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <NamedIcon name={table.icon} className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-sm">{table.name}</span>
                <span className="text-muted-foreground text-xs">
                  {table.groupName ?? "No group"}
                </span>
              </div>
              <span
                className="shrink-0 text-muted-foreground text-xs"
                title={new Date(table.updatedAt).toLocaleString()}
              >
                Updated {formatRelativeTime(table.updatedAt)}
              </span>
            </Link>
          ))}
          {empty && (
            <CardPanel className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {access.admin
                  ? "No tables yet. Create one to get started."
                  : "No tables yet. An administrator can create them."}
              </p>
              {access.admin && (
                <Button
                  size="sm"
                  render={
                    <Link
                      to="/workspaces/$workspace/tables/new"
                      params={{ workspace }}
                      search={{ step: 1 }}
                    />
                  }
                >
                  New table
                </Button>
              )}
            </CardPanel>
          )}
        </Card>
      </CardFrame>
    </>
  );
}
