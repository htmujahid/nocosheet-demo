import { createFileRoute, redirect } from "@tanstack/react-router";

import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { ViewsTrash } from "@/components/workspace/views/views-trash";
import { deletedViewsQueryOptions } from "@/data/workspace/views";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/_list/trash",
)({
  staticData: { crumb: "Deleted views" },
  pendingComponent: () => null,
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { workspace: params.workspace, table: params.table, view: ALL_VIEW },
        replace: true,
      });
  },
  loader: ({ context, params }) => {
    void context.queryClient
      .query(deletedViewsQueryOptions(params.workspace, Number(params.table)))
      .catch(() => undefined);
  },
  component: ViewsTrashSheet,
});

function ViewsTrashSheet() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <TrashSheet
      title="Deleted views"
      description={`Deleted views are kept for ${TRASH_RETENTION_DAYS} days.`}
      onClose={() =>
        navigate({ to: "/workspaces/$workspace/tables/$table/views", params: { workspace, table } })
      }
    >
      <ViewsTrash workspace={workspace} tableId={Number(table)} />
    </TrashSheet>
  );
}
