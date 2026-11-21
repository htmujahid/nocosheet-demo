import { DbProvider } from "@tanstack/react-db";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { grantsCollection } from "@/data/workspace/access";
import { membersCollection } from "@/data/workspace/members";
import { loadProfile } from "@/data/workspace/profile";
import { DEFAULT_ROLE, isAdmin } from "@/lib/auth/access";
import { openDbClient } from "@/lib/db/client";
import { openOfflineExecutor } from "@/lib/db/offline";
import { DEFAULT_WORKSPACE, DEFAULT_WORKSPACE_NAME } from "@/lib/workspace";

export const Route = createFileRoute("/workspaces/$workspace")({
  beforeLoad: async ({ context, location, params }) => {
    if (!context.session)
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } });
    if (params.workspace !== DEFAULT_WORKSPACE) {
      throw redirect({ to: "/workspaces/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    }

    const dbClient = await openDbClient(
      context.session.user.id,
      params.workspace,
      context.queryClient,
    );

    const offline = await openOfflineExecutor(context.session.user.id, params.workspace, dbClient);

    const grantRows = dbClient.collection(grantsCollection);
    await Promise.all([
      loadProfile(context.queryClient, context.session.user.id),
      grantRows.preload().catch(() => undefined),
    ]);
    if (grantRows.status === "error")
      throw new Error("Couldn't load your access to this workspace.");

    const role = (context.session.user as { role?: string | null }).role ?? DEFAULT_ROLE;
    return {
      dbClient,
      offline,
      access: { admin: isAdmin({ role }), grants: grantRows.toArray },
      workspace: {
        id: DEFAULT_WORKSPACE,
        name: DEFAULT_WORKSPACE_NAME,
        role,
        isAdmin: isAdmin({ role }),
      },
    };
  },
  loader: ({ context }) => {
    void context.dbClient
      .collection(membersCollection)
      .preload()
      .catch(() => undefined);
  },
  component: WorkspaceProvider,
});

function WorkspaceProvider() {
  const { dbClient } = Route.useRouteContext();
  return (
    <DbProvider client={dbClient}>
      <Outlet />
    </DbProvider>
  );
}
