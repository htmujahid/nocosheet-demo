import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Trash2Icon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { DeleteTablesDialog } from "@/components/workspace/tables/delete-tables-dialog";
import { TableDefinition } from "@/components/workspace/tables/table-definition";
import { TableDefinitionView } from "@/components/workspace/tables/table-definition-view";
import { useWorkspace } from "@/hooks/use-workspace";
import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/definition")({
  staticData: { crumb: "Definition" },
  beforeLoad: ({ context, location }) => {
    if (context.workspace.isAdmin) requireOnline(location);
  },
  component: DefinitionPage,
});

function DefinitionPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const tableId = Number(table);
  const { isAdmin } = useWorkspace();

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
                  to="/workspaces/$workspace/tables/$table/definition/trash"
                  params={{ workspace, table }}
                />
              }
            >
              <Trash2Icon />
              Deleted columns
            </Button>
            <DeleteTablesDialog
              workspace={workspace}
              ids={[tableId]}
              label="Delete table"
              size="sm"
              onDeleted={() =>
                navigate({ to: "/workspaces/$workspace/tables", params: { workspace } })
              }
            />
          </>
        )}
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        {isAdmin ? (
          <TableDefinition workspace={workspace} tableId={tableId} />
        ) : (
          <TableDefinitionView workspace={workspace} tableId={tableId} />
        )}
      </WorkspaceContent>
      <Outlet />
    </>
  );
}
