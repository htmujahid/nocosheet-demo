import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrashList } from "@/components/workspace/records/trash-list";
import { requireOnline } from "@/lib/require-online";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/trash")({
  staticData: { crumb: "Trash" },
  beforeLoad: ({ context, location, params }) => {
    requireOnline(location);
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { workspace: params.workspace, table: params.table, view: ALL_VIEW },
        replace: true,
      });
  },
  component: RecordsTrashPage,
});

function RecordsTrashPage() {
  const { workspace, table } = Route.useParams();

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent>
        <TrashList workspace={workspace} tableId={Number(table)} table={table} />
      </WorkspaceContent>
      <Outlet />
    </>
  );
}
