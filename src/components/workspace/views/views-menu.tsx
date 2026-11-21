import { useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";

import { CheckIcon, ChevronDownIcon, LayoutGridIcon, ListIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { viewsCollection } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";
import { ALL_VIEW } from "@/lib/views/constants";

import { NamedIcon } from "../tables/named-icon";
import { ViewDialog } from "./view-dialog";

export function ViewsMenu({
  workspace,
  table,
  activeView,
}: {
  workspace: string;
  table: string;
  activeView?: number;
}) {
  const tableId = Number(table);
  const access = useAccess();
  const { data: views } = useLiveQuery((q) =>
    q.from({ view: viewsCollection(tableId) }).orderBy(({ view }) => view.position),
  );
  const [creating, setCreating] = useState(false);
  const active = views.find((view) => view.id === activeView);

  if (!access.admin && views.length === 0) return null;

  return (
    <>
      <Menu>
        <MenuTrigger render={<Button variant="outline" aria-label="Views" />}>
          <LayoutGridIcon />
          <span className="max-w-40 truncate max-sm:hidden">{active?.name ?? "All records"}</span>
          <ChevronDownIcon />
        </MenuTrigger>
        <MenuPopup align="start" className="min-w-56">
          <MenuGroup>
            {access.can(tableId, "read") && (
              <MenuLinkItem
                render={
                  <Link
                    to="/workspaces/$workspace/tables/$table/views/$view"
                    params={{ workspace, table, view: ALL_VIEW }}
                  />
                }
              >
                <LayoutGridIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">All records</span>
                {!active && <CheckIcon className="ms-auto" />}
              </MenuLinkItem>
            )}
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
                {view.id === activeView && <CheckIcon className="ms-auto" />}
              </MenuLinkItem>
            ))}
          </MenuGroup>
          <MenuSeparator />
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
      {access.admin && (
        <ViewDialog
          workspace={workspace}
          tableId={tableId}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
    </>
  );
}
