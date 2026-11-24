import { useState } from "react";

import { useDbClient, useLiveQuery } from "@tanstack/react-db";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  ChevronDownIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Settings2Icon,
  Trash2Icon,
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
import { PendingRecords } from "@/components/workspace/records/pending-records";
import { useExportRecords } from "@/components/workspace/records/use-export-records";
import { recordsCollection } from "@/data/workspace/records";
import { viewsCollection } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";
import { useOnline } from "@/hooks/use-online";
import { ALL_VIEW } from "@/lib/views/constants";

import { DeleteViewDialog } from "./delete-view-dialog";
import { ViewSheet } from "./view-sheet";

export function ViewActions({
  workspace,
  table,
  view,
}: {
  workspace: string;
  table: string;
  view: number;
}) {
  const access = useAccess();
  const online = useOnline();
  const dbClient = useDbClient();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const tableId = Number(table);
  const { data: views } = useLiveQuery((q) =>
    q.from({ view: viewsCollection(tableId) }).orderBy(({ view }) => view.position),
  );
  const active = views.find((item) => item.id === view);
  const canCreate = access.can(tableId, "create");
  const canExport = access.can(tableId, "export") && access.can(tableId, "read");
  const exportRecords = useExportRecords(workspace, tableId, view);

  return (
    <div className="flex items-center gap-2">
      <PendingRecords tableId={tableId} />
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="outline"
              aria-label="View actions"
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
                          params={{ workspace, table, view: String(view) }}
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
          {access.admin && active && (
            <>
              <MenuSeparator />
              <MenuGroup>
                <MenuItem onClick={() => setDialog("edit")}>
                  <PencilIcon aria-hidden="true" />
                  Edit view
                </MenuItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuItem variant="destructive" onClick={() => setDialog("delete")}>
                  <Trash2Icon aria-hidden="true" />
                  Delete view
                </MenuItem>
              </MenuGroup>
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
              <Link
                to="/workspaces/$workspace/tables/$table/views/$view/new"
                params={{ workspace, table, view: String(view) }}
                search={(previous) => previous}
              />
            }
          >
            <PlusIcon aria-hidden="true" />
            <span className="max-sm:hidden">New record</span>
          </Button>
        )}
      </Group>
      {access.admin && active && (
        <>
          <ViewSheet
            workspace={workspace}
            tableId={tableId}
            open={dialog === "edit"}
            onOpenChange={(open) => !open && setDialog(null)}
            view={active}
          />
          <DeleteViewDialog
            workspace={workspace}
            tableId={tableId}
            view={active}
            open={dialog === "delete"}
            onOpenChange={(open) => !open && setDialog(null)}
            onDeleted={() =>
              void navigate({
                to: "/workspaces/$workspace/tables/$table/views/$view",
                params: { workspace, table, view: ALL_VIEW },
              })
            }
          />
        </>
      )}
    </div>
  );
}
