import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrashList } from "@/components/workspace/records/trash-list";
import { trashQueryOptions } from "@/data/workspace/trash";
import { useWorkspace } from "@/hooks/use-workspace";
import { resolveTrashQuery } from "@/lib/trash/query";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/trash")({
  staticData: { crumb: "Trash" },
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(trashQueryOptions(params.workspace, Number(params.table), resolveTrashQuery({})))
      .catch(() => undefined);
  },
  component: RecordsTrashPage,
});

function RecordsTrashPage() {
  const { workspace, table } = Route.useParams();
  const { isAdmin } = useWorkspace();

  if (!isAdmin)
    return (
      <Navigate
        to="/workspaces/$workspace/tables/$table/views/$view"
        params={{ workspace, table, view: ALL_VIEW }}
        replace
      />
    );

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
