import { createFileRoute, redirect } from "@tanstack/react-router";

import { ColumnsTrash } from "@/components/workspace/tables/columns-trash";
import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/definition/trash")(
  {
    staticData: { crumb: "Trash" },
    beforeLoad: ({ context, location, params }) => {
      requireOnline(location);
      if (!context.workspace.isAdmin)
        throw redirect({
          to: "/workspaces/$workspace/tables/$table",
          params: { workspace: params.workspace, table: params.table },
          replace: true,
        });
    },
    component: ColumnsTrashSheet,
  },
);

function ColumnsTrashSheet() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <TrashSheet
      title="Deleted columns"
      description={`Deleted columns keep their values for ${TRASH_RETENTION_DAYS} days. Restore one to bring it back with its data.`}
      onClose={() =>
        navigate({
          to: "/workspaces/$workspace/tables/$table/definition",
          params: { workspace, table },
        })
      }
    >
      <ColumnsTrash workspace={workspace} tableId={Number(table)} />
    </TrashSheet>
  );
}
