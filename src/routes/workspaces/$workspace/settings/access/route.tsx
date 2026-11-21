import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/workspaces/$workspace/settings/access")({
  staticData: { crumb: "Access" },
  beforeLoad: ({ context, location, params }) => {
    requireOnline(location);
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/workspaces/$workspace/settings",
        params: { workspace: params.workspace },
      });
  },
  component: Outlet,
});
