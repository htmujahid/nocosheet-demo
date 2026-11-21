import { createFileRoute, redirect } from "@tanstack/react-router";

import { TablesTrash } from "@/components/workspace/tables/tables-trash";
import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/_list/trash")({
  staticData: { crumb: "Trash" },
  beforeLoad: ({ context, location, params }) => {
    if (!context.workspace.isAdmin) throw redirect({ to: "/workspaces/$workspace/tables", params });
    requireOnline(location);
  },
  component: TablesTrashSheet,
});

function TablesTrashSheet() {
  const { workspace } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <TrashSheet
      title="Deleted tables"
      description={`Deleted tables are kept for ${TRASH_RETENTION_DAYS} days.`}
      onClose={() => navigate({ to: "/workspaces/$workspace/tables", params: { workspace } })}
    >
      <TablesTrash workspace={workspace} />
    </TrashSheet>
  );
}
