import { createFileRoute, redirect } from "@tanstack/react-router";

import { ImportRecordsSheet } from "@/components/workspace/records/import-records-sheet";
import { scopeFor } from "@/lib/access/grants";

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer/import",
)({
  pendingComponent: () => null,
  beforeLoad: ({ context, params }) => {
    if (scopeFor(context.access, "create", Number(params.table)) === "none")
      throw redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params,
        search: (previous) => previous,
        replace: true,
      });
  },
  component: ImportRecordsPage,
});

function ImportRecordsPage() {
  const { workspace, table, view } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <ImportRecordsSheet
      workspace={workspace}
      tableId={Number(table)}
      onClose={() =>
        navigate({
          to: "/workspaces/$workspace/tables/$table/views/$view",
          params: { workspace, table, view },
          search: (previous) => previous,
        })
      }
    />
  );
}
