import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  ArchiveRestoreIcon,
  DownloadIcon,
  EllipsisIcon,
  PlusIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { DeleteTablesAlert } from "@/components/workspace/tables/delete-tables-dialog";
import { ViewsMenu } from "@/components/workspace/views/views-menu";
import { workspaceKeys } from "@/data/workspace/keys";
import { viewsQueryOptions } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";

import { useExportRecords } from "./use-export-records";

export function TableActions({ workspace, table }: { workspace: string; table: string }) {
  const access = useAccess();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const tableId = Number(table);
  const exportRecords = useExportRecords(workspace, tableId);
  const { data: views } = useQuery(viewsQueryOptions(workspace, tableId));
  const showViews = access.admin || (views?.length ?? 0) > 0;
  const canCreate = access.can("create", tableId);
  const canExport = access.can("export", tableId) && access.can("read", tableId);

  return (
    <div className="flex items-center gap-2">
      {showViews && <ViewsMenu workspace={workspace} table={table} />}
      <Group>
        {canCreate && (
          <>
            <Button
              size="sm"
              variant="outline"
              aria-label="New record"
              className="max-sm:w-8 max-sm:px-0"
              render={
                <Link
                  to="/workspaces/$workspace/tables/$table/new"
                  params={{ workspace, table }}
                  search={(previous) => previous}
                />
              }
            >
              <PlusIcon aria-hidden="true" />
              <span className="max-sm:hidden">New record</span>
            </Button>
            <GroupSeparator />
          </>
        )}
        <Menu>
          <MenuTrigger
            render={<Button size="icon-sm" variant="outline" aria-label="More actions" />}
          >
            <EllipsisIcon aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup align="end">
            <MenuGroup>
              <MenuItem
                onClick={() =>
                  void queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) })
                }
              >
                <RefreshCwIcon aria-hidden="true" />
                Refresh
              </MenuItem>
            </MenuGroup>
            {(canCreate || canExport) && (
              <>
                <MenuSeparator />
                <MenuGroup>
                  {canCreate && (
                    <MenuLinkItem
                      render={
                        <Link
                          to="/workspaces/$workspace/tables/$table/import"
                          params={{ workspace, table }}
                          search={(previous) => previous}
                        />
                      }
                    >
                      <UploadIcon aria-hidden="true" />
                      Import
                    </MenuLinkItem>
                  )}
                  {canExport && (
                    <MenuItem
                      disabled={exportRecords.isPending}
                      onClick={() => exportRecords.mutate(undefined)}
                    >
                      <DownloadIcon aria-hidden="true" />
                      Export
                    </MenuItem>
                  )}
                </MenuGroup>
              </>
            )}
            <MenuSeparator />
            <MenuGroup>
              <MenuLinkItem
                render={
                  <Link
                    to="/workspaces/$workspace/tables/$table/definition"
                    params={{ workspace, table }}
                  />
                }
              >
                <SlidersHorizontalIcon aria-hidden="true" />
                Definition
              </MenuLinkItem>
              {access.admin && (
                <MenuLinkItem
                  render={
                    <Link to="/workspaces/$workspace/tables/$table/trash" params={{ workspace, table }} />
                  }
                >
                  <ArchiveRestoreIcon aria-hidden="true" />
                  Deleted records
                </MenuLinkItem>
              )}
            </MenuGroup>
            {access.admin && (
              <>
                <MenuSeparator />
                <MenuItem variant="destructive" onClick={() => setDeleting(true)}>
                  <TrashIcon aria-hidden="true" />
                  Delete table
                </MenuItem>
              </>
            )}
          </MenuPopup>
        </Menu>
      </Group>
      {access.admin && (
        <DeleteTablesAlert
          workspace={workspace}
          ids={[tableId]}
          open={deleting}
          onOpenChange={setDeleting}
          onDeleted={() => navigate({ to: "/workspaces/$workspace/tables", params: { workspace } })}
        />
      )}
    </div>
  );
}
