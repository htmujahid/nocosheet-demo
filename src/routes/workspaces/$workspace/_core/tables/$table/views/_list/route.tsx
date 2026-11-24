import { useState } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PlusIcon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { ViewSheet } from "@/components/workspace/views/view-sheet";
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
        <ViewSheet
          workspace={workspace}
          tableId={Number(table)}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
    </>
  );
}
