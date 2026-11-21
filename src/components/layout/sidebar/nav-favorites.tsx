import { useState } from "react";

import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";

import { ChevronUpIcon, MoreHorizontalIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import { favoritesCollection } from "@/data/workspace/favorites";
import { tablesCollection } from "@/data/workspace/tables";
import { useIsActivePath } from "@/hooks/use-is-active-path";

import { TableMenu } from "./table-menu";

const VISIBLE = 3;

export function NavFavorites({ workspace }: { workspace: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: favorites } = useLiveSuspenseQuery((q) =>
    q
      .from({ favorite: favoritesCollection })
      .innerJoin({ table: tablesCollection }, ({ favorite, table }) =>
        eq(favorite.tableId, table.id),
      )
      .where(({ table }) => eq(table.isHidden, false))
      .orderBy(({ favorite }) => favorite.createdAt)
      .select(({ table }) => ({ id: table.id, name: table.name, icon: table.icon })),
  );
  const isActive = useIsActivePath();
  const visible = expanded ? favorites : favorites.slice(0, VISIBLE);

  if (favorites.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((table) => (
            <SidebarMenuItem key={table.id}>
              <SidebarMenuButton
                tooltip={table.name}
                isActive={isActive(`/workspaces/${workspace}/tables/${table.id}`)}
                render={
                  <Link
                    to="/workspaces/$workspace/tables/$table"
                    params={{ workspace, table: String(table.id) }}
                  />
                }
              >
                <NamedIcon name={table.icon} />
                <span>{table.name}</span>
              </SidebarMenuButton>
              <TableMenu table={table} favorite workspace={workspace} />
            </SidebarMenuItem>
          ))}
          {favorites.length > VISIBLE && (
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-sidebar-foreground/70"
                tooltip={expanded ? "Show less" : "More"}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? <ChevronUpIcon /> : <MoreHorizontalIcon />}
                <span>{expanded ? "Less" : "More"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
