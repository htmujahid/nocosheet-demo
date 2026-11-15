import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsNotifications } from "@/components/workspace/settings/notifications";

export const Route = createFileRoute("/workspaces/$workspace/settings/notifications")({
  staticData: { crumb: "Notifications" },
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsNotifications />
      </WorkspaceContent>
    </>
  );
}
