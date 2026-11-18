import { useState } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PlusIcon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/workspace/forms/form-dialog";
import { FormsEmpty } from "@/components/workspace/forms/forms-empty";
import { FormsTable } from "@/components/workspace/forms/forms-table";
import { useWorkspace } from "@/hooks/use-workspace";
import { validateFormsSearch } from "@/lib/forms/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/forms/_list")({
  validateSearch: validateFormsSearch,
  component: FormsPage,
});

function FormsPage() {
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
              New form
            </Button>
          </>
        )}
      </WorkspaceHeader>
      <WorkspaceContent>
        <FormsTable
          workspace={workspace}
          table={table}
          empty="No forms match your filters."
          placeholder={<FormsEmpty onCreate={() => setCreating(true)} />}
        />
      </WorkspaceContent>
      <Outlet />
      {isAdmin && (
        <FormDialog
          workspace={workspace}
          tableId={Number(table)}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
    </>
  );
}
