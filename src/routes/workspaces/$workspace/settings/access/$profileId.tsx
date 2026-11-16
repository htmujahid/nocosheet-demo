import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { ProfileEditor } from "@/components/workspace/settings/access-profiles/profile-editor";
import { accessProfilesQueryOptions } from "@/data/workspace/access-profiles";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";

export const Route = createFileRoute("/workspaces/$workspace/settings/access/$profileId")({
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/workspaces/$workspace/settings/access",
        params: { workspace: params.workspace },
      });
  },
  loader: async ({ context, params }) => {
    const [profiles] = await Promise.all([
      context.queryClient.query({ ...accessProfilesQueryOptions(params.workspace), staleTime: 0 }),
      context.queryClient.query(sidebarQueryOptions(params.workspace)),
    ]);
    const profile = profiles.find((item) => item.id === Number(params.profileId));
    if (!profile) throw notFound();
    return { profileName: profile.name };
  },
  staticData: {
    crumb: (loaderData) =>
      (loaderData as { profileName?: string } | undefined)?.profileName ?? "Access profile",
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { workspace, profileId } = Route.useParams();

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <ProfileEditor workspace={workspace} profileId={Number(profileId)} />
      </WorkspaceContent>
    </>
  );
}
