import { useState } from "react";

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/workspace/forms/form-dialog";
import { FormsEmpty } from "@/components/workspace/forms/forms-empty";
import { FormsTable } from "@/components/workspace/forms/forms-table";
import { formsPageQueryOptions } from "@/data/workspace/forms";
import { useWorkspace } from "@/hooks/use-workspace";
import { resolveFormsQuery, validateFormsSearch } from "@/lib/forms/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/forms/_list")({
  validateSearch: validateFormsSearch,
  loaderDeps: ({ search }) => resolveFormsQuery(search),
  loader: ({ context, deps, params }) => {
    void context.queryClient
      .query(formsPageQueryOptions(params.workspace, Number(params.table), deps))
      .catch(() => undefined);
  },
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
            <Button
              size="sm"
              variant="outline"
              render={
                <Link
                  to="/workspaces/$workspace/tables/$table/forms/trash"
                  params={{ workspace, table }}
                />
              }
            >
              <Trash2Icon />
              Trash
            </Button>
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
