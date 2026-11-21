import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { MemberNotFound } from "@/components/workspace/settings/members/member-not-found";
import { MemberTabs } from "@/components/workspace/settings/members/member-tabs";
import { adminUserQueryOptions } from "@/data/admin/user";
import { membersCollection } from "@/data/workspace/members";
import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/workspaces/$workspace/settings/members/$userId")({
  beforeLoad: ({ context, location, params }) => {
    requireOnline(location);
    if (!context.workspace.isAdmin) {
      throw redirect({
        to: "/workspaces/$workspace/settings/members",
        params: { workspace: params.workspace },
      });
    }
    return { isSelf: context.session?.user.id === params.userId };
  },
  loader: async ({ context, params }) => {
    const members = context.dbClient.collection(membersCollection);
    await members.preload();
    const member = members.get(params.userId);
    if (!member) throw notFound();

    void context.queryClient
      .query({ ...adminUserQueryOptions(params.userId), staleTime: "static" })
      .catch(() => undefined);
    return { memberName: member.name };
  },
  staticData: {
    crumb: (loaderData) =>
      (loaderData as { memberName?: string } | undefined)?.memberName ?? "Member",
  },
  notFoundComponent: MemberNotFound,
  component: MemberLayout,
});

function MemberLayout() {
  const { workspace, userId } = Route.useParams();
  const { isSelf } = Route.useRouteContext();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="flex max-w-3xl flex-col gap-6">
        {!isSelf && <MemberTabs workspace={workspace} userId={userId} />}
        <Outlet />
      </WorkspaceContent>
    </>
  );
}
