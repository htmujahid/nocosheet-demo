import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { CreateRecordPage } from "@/components/workspace/records/create-record-page";
import { scopeFor } from "@/lib/access/grants";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/new")({
  staticData: { crumb: "New record" },
  beforeLoad: ({ context, params }) => {
    if (scopeFor(context.access, "create", Number(params.table)) === "none")
      throw redirect({ to: "/workspaces/$workspace/tables/$table", params, replace: true });
  },
  component: NewRecordPage,
});

function NewRecordPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <CreateRecordPage
          workspace={workspace}
          tableId={Number(table)}
          cancel={<Link to="/workspaces/$workspace/tables/$table" params={{ workspace, table }} />}
          onCreated={() =>
            navigate({
              to: "/workspaces/$workspace/tables/$table/views/$view",
              params: { workspace, table, view: ALL_VIEW },
            })
          }
        />
      </WorkspaceContent>
    </>
  );
}
