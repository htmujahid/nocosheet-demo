import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsGeneral } from "@/components/workspace/settings/general";
import { membersQueryOptions } from "@/data/workspace/members";

export const Route = createFileRoute("/workspaces/$workspace/settings/")({
  staticData: { crumb: "General" },
  loader: ({ context }) => {
    void context.queryClient
      .query({ ...membersQueryOptions, staleTime: "static" })
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
        <SettingsGeneral />
      </WorkspaceContent>
    </>
  );
}
