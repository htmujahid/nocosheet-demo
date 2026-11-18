import { createFileRoute, redirect } from "@tanstack/react-router";

import { FormsTrash } from "@/components/workspace/forms/forms-trash";
import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { deletedFormsQueryOptions } from "@/data/workspace/forms";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/forms/_list/trash",
)({
  staticData: { crumb: "Deleted forms" },
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
      .query(deletedFormsQueryOptions(params.workspace, Number(params.table)))
      .catch(() => undefined);
  },
  component: FormsTrashSheet,
});

function FormsTrashSheet() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <TrashSheet
      title="Deleted forms"
      description={`Deleted forms are kept for ${TRASH_RETENTION_DAYS} days.`}
      onClose={() =>
        navigate({ to: "/workspaces/$workspace/tables/$table/forms", params: { workspace, table } })
      }
    >
      <FormsTrash workspace={workspace} tableId={Number(table)} />
    </TrashSheet>
  );
}
