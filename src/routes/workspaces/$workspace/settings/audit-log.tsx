import { createFileRoute, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsAuditLog } from "@/components/workspace/settings/audit-log";
import { validateAuditSearch } from "@/lib/audit/query";
import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/workspaces/$workspace/settings/audit-log")({
  staticData: { crumb: "Audit Log" },
  validateSearch: validateAuditSearch,
  beforeLoad: ({ context, location, params }) => {
    requireOnline(location);
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
      <WorkspaceContent>
        <SettingsAuditLog workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
