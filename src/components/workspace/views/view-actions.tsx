import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  ChevronDownIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Group } from "@/components/ui/group";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { FormsMenu } from "@/components/workspace/forms/forms-menu";
import { useExportRecords } from "@/components/workspace/records/use-export-records";
import { workspaceKeys } from "@/data/workspace/keys";
import { viewsQueryOptions } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";

import { DeleteViewDialog } from "./delete-view-dialog";
import { ViewDialog } from "./view-dialog";

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const tableId = Number(table);
  const { data: views = [] } = useQuery(viewsQueryOptions(workspace, tableId));
  const active = views.find((item) => item.id === view);
  const canCreate = access.can("create", tableId);
  const canExport = access.can("export", tableId) && access.can("read", tableId);
  const exportRecords = useExportRecords(workspace, tableId, view);

  return (
    <div className="flex items-center gap-2">
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
                void queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) })
              }
            >
              <RefreshCwIcon aria-hidden="true" />
              Refresh
            </MenuItem>
          </MenuGroup>
          {canExport && (
            <>
              <MenuSeparator />
              <MenuGroup>
                <MenuItem
                  disabled={exportRecords.isPending}
                  onClick={() => exportRecords.mutate(undefined)}
                >
                  <DownloadIcon aria-hidden="true" />
                  Export
                </MenuItem>
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
        <FormsMenu workspace={workspace} table={table} grouped={canCreate} />
      </Group>
      {access.admin && active && (
        <>
          <ViewDialog
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
                to: "/workspaces/$workspace/tables/$table",
                params: { workspace, table },
              })
            }
          />
        </>
      )}
    </div>
  );
}
