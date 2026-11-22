import { createFileRoute, redirect } from "@tanstack/react-router";

import { AssistantDrawer } from "@/components/workspace/records/assistant/assistant-drawer";
import { scopeFor } from "@/lib/access/grants";

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer/assistant",
)({
  pendingComponent: () => null,
  beforeLoad: ({ context, params }) => {
    if (scopeFor(context.access, Number(params.table), "read") === "none")
      throw redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params,
        search: (previous) => previous,
        replace: true,
      });
  },
  component: AssistantPage,
});

function AssistantPage() {
  const { workspace, table, view } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <AssistantDrawer
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
