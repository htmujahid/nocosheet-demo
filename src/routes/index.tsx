import { createFileRoute, redirect } from "@tanstack/react-router";

import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/workspaces/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    }
    throw redirect({ to: "/auth/sign-in" });
  },
});
