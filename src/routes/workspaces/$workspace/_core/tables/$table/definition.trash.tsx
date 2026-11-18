import { createFileRoute, redirect } from "@tanstack/react-router";

import { ColumnsTrash } from "@/components/workspace/tables/columns-trash";
import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { deletedColumnsQueryOptions } from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/definition/trash")({
  staticData: { crumb: "Trash" },
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { workspace: params.workspace, table: params.table, view: ALL_VIEW },
        replace: true,
      });
  },
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(deletedColumnsQueryOptions(params.workspace, Number(params.table)))
      .catch(() => undefined);
  },
  component: ColumnsTrashSheet,
});

function ColumnsTrashSheet() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <TrashSheet
      title="Deleted columns"
      description={`Deleted columns keep their values for ${TRASH_RETENTION_DAYS} days. Restore one to bring it back with its data.`}
      onClose={() =>
        navigate({ to: "/workspaces/$workspace/tables/$table/definition", params: { workspace, table } })
      }
    >
      <ColumnsTrash workspace={workspace} tableId={Number(table)} />
    </TrashSheet>
  );
}
