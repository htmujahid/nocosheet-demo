import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { CreateProfileDialog } from "@/components/workspace/settings/access-profiles/create-profile-dialog";
import { ProfilesList } from "@/components/workspace/settings/access-profiles/profiles-list";
import { YourAccess } from "@/components/workspace/settings/access-profiles/your-access";
import { accessProfilesQueryOptions } from "@/data/workspace/access-profiles";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/workspaces/$workspace/settings/access/")({
  // Administrators manage access profiles; everyone else sees what they can do.
  loader: ({ context, params }) =>
    context.workspace.isAdmin
      ? context.queryClient.query(accessProfilesQueryOptions(params.workspace))
      : context.queryClient.query(sidebarQueryOptions(params.workspace)),
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
