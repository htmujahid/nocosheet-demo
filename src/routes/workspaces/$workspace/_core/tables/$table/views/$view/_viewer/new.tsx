import { createFileRoute, redirect } from "@tanstack/react-router";

import { CreateRecordSheet } from "@/components/workspace/records/record-sheet/create-record-sheet";
import { scopeFor } from "@/lib/access/grants";

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer/new",
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
  component: NewRecordPage,
});

function NewRecordPage() {
  const { workspace, table, view } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <CreateRecordSheet
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
