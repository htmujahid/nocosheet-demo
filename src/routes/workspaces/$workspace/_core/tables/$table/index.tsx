import { createFileRoute, Navigate } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TableActions } from "@/components/workspace/records/table-actions";
import { TableOverview } from "@/components/workspace/tables/table-overview";
import { useAccess } from "@/hooks/use-access";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/")({
  component: TablePage,
});

function TablePage() {
  const { workspace, table } = Route.useParams();
  const access = useAccess();

  if (!access.can("read", Number(table)))
    return (
      <Navigate
        to="/workspaces/$workspace/tables/$table/views/$view"
        params={{ workspace, table, view: ALL_VIEW }}
        replace
      />
    );

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <TableActions workspace={workspace} table={table} newRecord="page" />
      </WorkspaceHeader>
      <WorkspaceContent>
        <TableOverview workspace={workspace} table={table} />
      </WorkspaceContent>
    </>
  );
}
