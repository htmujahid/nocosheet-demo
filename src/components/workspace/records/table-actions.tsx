import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  ArchiveRestoreIcon,
  ChevronDownIcon,
  DownloadIcon,
  PlusIcon,
  RefreshCwIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Group } from "@/components/ui/group";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { FormsMenu } from "@/components/workspace/forms/forms-menu";
import { DeleteTablesAlert } from "@/components/workspace/tables/delete-tables-dialog";
import { workspaceKeys } from "@/data/workspace/keys";
import { useAccess } from "@/hooks/use-access";
import { ALL_VIEW } from "@/lib/views/constants";

import { useExportRecords } from "./use-export-records";

/**
 * Header actions for a table. `newRecord` picks where New record goes: a sheet over the grid
 * (default) or the full-page form.
 */
export function TableActions({
  workspace,
  table,
  newRecord = "sheet",
}: {
  workspace: string;
  table: string;
  newRecord?: "sheet" | "page";
}) {
  const access = useAccess();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const tableId = Number(table);
  const exportRecords = useExportRecords(workspace, tableId);
  const canCreate = access.can("create", tableId);
  const canExport = access.can("export", tableId) && access.can("read", tableId);

  return (
    <div className="flex items-center gap-2">
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="outline"
              aria-label="Table actions"
              className="max-sm:w-9 max-sm:px-0"
            />
          }
        >
          <Settings2Icon aria-hidden="true" />
          <span className="max-sm:hidden">Actions</span>
          <ChevronDownIcon aria-hidden="true" className="max-sm:hidden" />
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
                        to="/workspaces/$workspace/tables/$table/views/$view/import"
                        params={{ workspace, table, view: ALL_VIEW }}
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
                  <Link
                    to="/workspaces/$workspace/tables/$table/trash"
                    params={{ workspace, table }}
                  />
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
      <Group>
        {canCreate && (
          <Button
            variant="outline"
            aria-label="New record"
            className="max-sm:w-9 max-sm:px-0"
            render={
              newRecord === "page" ? (
                <Link to="/workspaces/$workspace/tables/$table/new" params={{ workspace, table }} />
              ) : (
                <Link
                  to="/workspaces/$workspace/tables/$table/views/$view/new"
                  params={{ workspace, table, view: ALL_VIEW }}
                  search={(previous) => previous}
                />
              )
            }
          >
            <PlusIcon aria-hidden="true" />
            <span className="max-sm:hidden">New record</span>
          </Button>
        )}
        <FormsMenu workspace={workspace} table={table} grouped={canCreate} />
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
