import { createFileRoute, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsAuditLog } from "@/components/workspace/settings/audit-log";

export const Route = createFileRoute("/workspaces/$workspace/settings/audit-log")({
  staticData: { crumb: "Audit Log" },
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/workspaces/$workspace/settings",
        params: { workspace: params.workspace },
      });
  },
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsAuditLog />
      </WorkspaceContent>
    </>
  );
}
