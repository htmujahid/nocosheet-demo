import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { CreateRecordPage } from "@/components/workspace/records/create-record-page";
import { useAccess } from "@/hooks/use-access";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/new")({
  staticData: { crumb: "New record" },
  component: NewRecordPage,
});

function NewRecordPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const access = useAccess();

  if (!access.can("create", Number(table)))
    return (
      <Navigate to="/workspaces/$workspace/tables/$table" params={{ workspace, table }} replace />
    );

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
