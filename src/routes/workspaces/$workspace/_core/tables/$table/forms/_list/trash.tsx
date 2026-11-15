import { createFileRoute, Navigate } from "@tanstack/react-router";

import { FormsTrash } from "@/components/workspace/forms/forms-trash";
import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { deletedFormsQueryOptions } from "@/data/workspace/forms";
import { useWorkspace } from "@/hooks/use-workspace";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/forms/_list/trash",
)({
  staticData: { crumb: "Deleted forms" },
  pendingComponent: () => null,
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
  const { isAdmin } = useWorkspace();

  if (!isAdmin)
    return (
      <Navigate to="/workspaces/$workspace/tables/$table" params={{ workspace, table }} replace />
    );

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
