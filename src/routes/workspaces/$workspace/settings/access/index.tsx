import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { CreateProfileDialog } from "@/components/workspace/settings/access-profiles/create-profile-dialog";
import { ProfilesList } from "@/components/workspace/settings/access-profiles/profiles-list";
import { YourAccess } from "@/components/workspace/settings/access-profiles/your-access";
import { accessProfilesQueryOptions } from "@/data/workspace/access-profiles";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/workspaces/$workspace/settings/access/")({
  // Administrators manage access profiles; everyone else sees what they can do (from the access
  // and sidebar data the workspace route already loaded).
  loader: ({ context, params }) => {
    if (context.workspace.isAdmin)
      void context.queryClient
        .query(accessProfilesQueryOptions(params.workspace))
        .catch(() => undefined);
  },
  component: AccessPage,
});

function AccessPage() {
  const { workspace } = Route.useParams();
  const { isAdmin } = useWorkspace();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        {isAdmin && <CreateProfileDialog workspace={workspace} />}
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        {isAdmin ? <ProfilesList workspace={workspace} /> : <YourAccess workspace={workspace} />}
      </WorkspaceContent>
    </>
  );
}
