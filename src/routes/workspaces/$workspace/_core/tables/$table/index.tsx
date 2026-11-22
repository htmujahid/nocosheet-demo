import { createFileRoute, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TableActions } from "@/components/workspace/records/table-actions";
import { TableOverview } from "@/components/workspace/tables/table-overview";
import { scopeFor } from "@/lib/access/grants";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/")({
  beforeLoad: ({ context, params }) => {
    if (scopeFor(context.access, Number(params.table), "read") === "none")
      throw redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { ...params, view: ALL_VIEW },
        replace: true,
      });
  },
  component: TablePage,
});

function TablePage() {
  const { workspace, table } = Route.useParams();

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
