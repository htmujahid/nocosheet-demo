import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";

import { workspaceKeys } from "./keys";

export const resetWorkspaceMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("reset-workspace"),
  mutationFn: ({ workspace }: { workspace: string }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/reset", { method: "POST", params: { workspace } }),
    ),
});
