import { useState } from "react";

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { ViewDialog } from "@/components/workspace/views/view-dialog";
import { ViewsEmpty } from "@/components/workspace/views/views-empty";
import { ViewsTable } from "@/components/workspace/views/views-table";
import { useWorkspace } from "@/hooks/use-workspace";
import { validateViewsSearch } from "@/lib/views/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/_list")({
  validateSearch: validateViewsSearch,
  component: ViewsPage,
});

function ViewsPage() {
  const { workspace, table } = Route.useParams();
  const { isAdmin } = useWorkspace();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        {isAdmin && (
          <>
            <Button
              size="sm"
              variant="outline"
              render={
                <Link to="/workspaces/$workspace/tables/$table/views/trash" params={{ workspace, table }} />
              }
            >
              <Trash2Icon />
              Trash
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon />
              New view
            </Button>
          </>
        )}
      </WorkspaceHeader>
      <WorkspaceContent>
        <ViewsTable
          workspace={workspace}
          table={table}
          empty="No views match your filters."
          placeholder={<ViewsEmpty onCreate={() => setCreating(true)} />}
        />
      </WorkspaceContent>
      <Outlet />
      {isAdmin && (
        <ViewDialog
          workspace={workspace}
          tableId={Number(table)}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
    </>
  );
}
