import { useState } from "react";

import { useDbClient } from "@tanstack/react-db";
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
import { DeleteTablesAlert } from "@/components/workspace/tables/delete-tables-dialog";
import { recordsCollection } from "@/data/workspace/records";
import { useAccess } from "@/hooks/use-access";
import { useOnline } from "@/hooks/use-online";
import { ALL_VIEW } from "@/lib/views/constants";

import { PendingRecords } from "./pending-records";
import { useExportRecords } from "./use-export-records";

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
  const online = useOnline();
  const dbClient = useDbClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const tableId = Number(table);
  const exportRecords = useExportRecords(workspace, tableId);
  const canCreate = access.can(tableId, "create");
  const canExport = access.can(tableId, "export") && access.can(tableId, "read");

  return (
    <div className="flex items-center gap-2">
      <PendingRecords tableId={tableId} />
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
                void dbClient
                  .collection(recordsCollection(tableId))
                  .utils.pull()
                  .catch(() => undefined)
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
                {canCreate &&
                  (online ? (
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
                  ) : (
                    <MenuItem disabled>
                      <UploadIcon aria-hidden="true" />
                      Import (needs a connection)
                    </MenuItem>
                  ))}
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
