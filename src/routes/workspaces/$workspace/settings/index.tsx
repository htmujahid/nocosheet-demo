import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { YourAccess } from "@/components/workspace/settings/access-profiles/your-access";
import { ClearCacheCard } from "@/components/workspace/settings/clear-cache";
import { SettingsGeneral } from "@/components/workspace/settings/general";
import { ResetWorkspaceCard } from "@/components/workspace/settings/reset-workspace";
import { membersCollection } from "@/data/workspace/members";

export const Route = createFileRoute("/workspaces/$workspace/settings/")({
  staticData: { crumb: "General" },
  loader: ({ context }) => {
    void context.dbClient
      .collection(membersCollection)
      .preload()
      .catch(() => undefined);
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <div className="flex flex-col gap-6">
          <SettingsGeneral />
          <YourAccess />
          <ClearCacheCard workspace={workspace} />
          <ResetWorkspaceCard workspace={workspace} />
        </div>
      </WorkspaceContent>
    </>
  );
}
