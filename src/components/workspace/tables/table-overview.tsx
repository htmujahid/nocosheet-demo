import { useState } from "react";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";

import { ChevronDownIcon, LayoutGridIcon, ListIcon, PlusIcon, TableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Group, GroupSeparator } from "@/components/ui/group";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { columnsCollection } from "@/data/workspace/columns";
import { recordsCollection } from "@/data/workspace/records";
import { tablesCollection } from "@/data/workspace/tables";
import { viewsCollection } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";
import { useSession } from "@/hooks/use-session";
import { ALL_VIEW } from "@/lib/views/constants";

import { ViewSheet } from "../views/view-sheet";
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
  const session = useSession();
  const { data: info } = useLiveQuery((q) =>
    q
      .from({ table: tablesCollection })
      .where(({ table }) => eq(table.id, tableId))
      .findOne(),
  );

  const records = access.scope(tableId, "read") === "own" ? "My records" : "All records";
  const { data: stored, isReady: recordsReady } = useLiveQuery((q) =>
    q.from({ record: recordsCollection(tableId) }),
  );

  const readOwner = access.scope(tableId, "read") === "own" ? session?.user.id : undefined;
  const visible = readOwner ? stored.filter((record) => record.created_by === readOwner) : stored;
  const recordsLabel = recordsReady ? visible.length.toLocaleString() : "—";
  const { data: views } = useLiveQuery((q) =>
    q.from({ view: viewsCollection(tableId) }).orderBy(({ view }) => view.position),
  );
  const [creating, setCreating] = useState(false);
  const { data: columns, isReady: columnsReady } = useLiveQuery((q) =>
    q.from({ column: columnsCollection(tableId) }),
  );
  const columnCount = columnsReady ? columns.length : undefined;
  const titleColumn =
    columns.find((column) => column.id === info?.titleColumnId)?.columnName ?? null;

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
        <Group aria-label="Views">
          <Button
            variant="outline"
            render={
              <Link
                to="/workspaces/$workspace/tables/$table/views/$view"
                params={{ workspace, table, view: ALL_VIEW }}
              />
            }
          >
            <TableIcon aria-hidden="true" />
            {records}
          </Button>
          <GroupSeparator />
          <Menu>
            <MenuTrigger render={<Button variant="outline" size="icon" aria-label="Views" />}>
              <ChevronDownIcon aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="end" className="min-w-56">
              {views.length > 0 && (
                <>
                  <MenuGroup>
                    {views.map((view) => (
                      <MenuLinkItem
                        key={view.id}
                        render={
                          <Link
                            to="/workspaces/$workspace/tables/$table/views/$view"
                            params={{ workspace, table, view: String(view.id) }}
                          />
                        }
                      >
                        <NamedIcon
                          name={view.icon}
                          fallback={LayoutGridIcon}
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <span className="truncate">{view.name}</span>
                      </MenuLinkItem>
                    ))}
                  </MenuGroup>
                  <MenuSeparator />
                </>
              )}
              <MenuGroup>
                <MenuLinkItem
                  render={
                    <Link
                      to="/workspaces/$workspace/tables/$table/views"
                      params={{ workspace, table }}
                    />
                  }
                >
                  <ListIcon aria-hidden="true" />
                  All views
                </MenuLinkItem>
                {access.admin && (
                  <MenuItem onClick={() => setCreating(true)}>
                    <PlusIcon aria-hidden="true" />
                    New view
                  </MenuItem>
                )}
              </MenuGroup>
            </MenuPopup>
          </Menu>
        </Group>
      </div>

      <Card>
        <div className="grid grid-cols-2 divide-x sm:grid-flow-col sm:auto-cols-fr">
          <Stat label={records} value={recordsLabel} />
          <Stat label="Columns" value={columnCount ?? "—"} />
        </div>
      </Card>

      <RecentRecords workspace={workspace} table={table} titleColumn={titleColumn} />

      {access.admin && (
        <ViewSheet
          workspace={workspace}
          tableId={tableId}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
    </div>
  );
}
