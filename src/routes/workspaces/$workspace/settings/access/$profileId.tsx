import { createFileRoute, notFound } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { ProfileEditor } from "@/components/workspace/settings/access-profiles/profile-editor";
import { accessProfilesQueryOptions } from "@/data/workspace/access-profiles";

export const Route = createFileRoute("/workspaces/$workspace/settings/access/$profileId")({
  loader: async ({ context, params }) => {
    const profiles = await context.queryClient.query(accessProfilesQueryOptions(params.workspace));
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
