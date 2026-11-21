import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { CreateProfileDialog } from "@/components/workspace/settings/access-profiles/create-profile-dialog";
import { ProfilesList } from "@/components/workspace/settings/access-profiles/profiles-list";
import { accessProfilesQueryOptions } from "@/data/workspace/access-profiles";

export const Route = createFileRoute("/workspaces/$workspace/settings/access/")({
  loader: ({ context, params }) => {
    void context.queryClient
      .query(accessProfilesQueryOptions(params.workspace))
      .catch(() => undefined);
  },
  component: AccessPage,
});

function AccessPage() {
  const { workspace } = Route.useParams();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <CreateProfileDialog workspace={workspace} />
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        <ProfilesList workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
