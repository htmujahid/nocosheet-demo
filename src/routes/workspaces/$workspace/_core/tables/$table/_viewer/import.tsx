import { createFileRoute, Navigate } from "@tanstack/react-router";

import { ImportRecordsSheet } from "@/components/workspace/records/import-records-sheet";
import { useAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/_viewer/import")({
  pendingComponent: () => null,
  component: ImportRecordsPage,
});

function ImportRecordsPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const access = useAccess();

  if (!access.can("create", Number(table)))
    return (
      <Navigate
        to="/workspaces/$workspace/tables/$table"
        params={{ workspace, table }}
        search={(previous) => previous}
        replace
      />
    );

  return (
    <ImportRecordsSheet
      workspace={workspace}
      tableId={Number(table)}
      onClose={() =>
        navigate({
          to: "/workspaces/$workspace/tables/$table",
          params: { workspace, table },
          search: (previous) => previous,
        })
      }
    />
  );
}
