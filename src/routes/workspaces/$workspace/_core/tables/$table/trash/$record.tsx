import { createFileRoute } from "@tanstack/react-router";

import { RestoreRecordSheet } from "@/components/workspace/records/record-sheet/restore-record-sheet";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/trash/$record")({
  pendingComponent: () => null,
  component: RestoreRecordPage,
});

function RestoreRecordPage() {
  const { workspace, table, record } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <RestoreRecordSheet
      workspace={workspace}
      tableId={Number(table)}
      recordId={Number(record)}
      onClose={() =>
        navigate({
          to: "/workspaces/$workspace/tables/$table/trash",
          params: { workspace, table },
          search: (previous) => previous,
        })
      }
    />
  );
}
