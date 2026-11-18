import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { accessQueryOptions } from "@/data/workspace/access";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { DEFAULT_ROLE, isAdmin } from "@/lib/auth/access";
import { DEFAULT_WORKSPACE, DEFAULT_WORKSPACE_NAME } from "@/lib/workspace";

export const Route = createFileRoute("/workspaces/$workspace")({
  beforeLoad: async ({ context, location, params }) => {
    if (!context.session) throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } });
    // One workspace per instance: any other slug resolves to the default one.
    if (params.workspace !== DEFAULT_WORKSPACE) {
      throw redirect({ to: "/workspaces/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    }

    const access = await context.queryClient.query(accessQueryOptions(params.workspace));
    const role = (context.session.user as { role?: string | null }).role ?? DEFAULT_ROLE;
    return {
      workspace: {
        id: DEFAULT_WORKSPACE,
        name: DEFAULT_WORKSPACE_NAME,
        role,
        isAdmin: isAdmin({ role }),
      },
      access,
    };
  },
  loader: async ({ context, params }) => {
    await context.queryClient.query(sidebarQueryOptions(params.workspace));
  },
  component: Outlet,
});
