import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";

import { PlusIcon } from "lucide-react";

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
import { groupTables, tablesCollection } from "@/data/workspace/tables";
import { useIsActivePath } from "@/hooks/use-is-active-path";
import { useWorkspace } from "@/hooks/use-workspace";

import { TableMenu } from "./table-menu";

export function NavTables({ workspace }: { workspace: string }) {
  const { data: tables } = useLiveSuspenseQuery((q) =>
    q
      .from({ table: tablesCollection })
      .leftJoin({ favorite: favoritesCollection }, ({ table, favorite }) =>
        eq(favorite.tableId, table.id),
      )
      .where(({ table }) => eq(table.isHidden, false))
      .orderBy(({ table }) => table.position)
      .orderBy(({ table }) => table.id)
      .select(({ table, favorite }) => ({
        id: table.id,
        name: table.name,
        icon: table.icon,
        groupName: table.groupName,
        favoritedAt: favorite?.createdAt,
      })),
  );
  const groups = groupTables(tables);
  const { isAdmin } = useWorkspace();
  const isActive = useIsActivePath();

  if (groups.length === 0) {
    if (!isAdmin) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Tables</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="New table"
                className="text-sidebar-foreground/70"
                render={
                  <Link
                    to="/workspaces/$workspace/tables/new"
                    params={{ workspace }}
                    search={{ step: 1 }}
                  />
                }
              >
                <PlusIcon />
                <span>New table</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return groups.map((group) => (
    <SidebarGroup key={group.name ?? "__ungrouped__"}>
      <SidebarGroupLabel>{group.name ?? "Tables"}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.tables.map((table) => (
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
              <TableMenu table={table} favorite={table.favoritedAt != null} workspace={workspace} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
