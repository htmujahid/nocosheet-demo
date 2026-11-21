import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";

import { workspaceKeys } from "./keys";

export const templatesQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.templates(),
    queryFn: () =>
      unwrapFetch(fetch("/api/workspaces/:workspace/templates", { params: { workspace } })),
    staleTime: 5 * 60_000,
  });

export const applyTemplateMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("apply-template"),
  mutationFn: ({
    workspace,
    template,
    sampleData,
  }: {
    workspace: string;
    template: string;
    sampleData: boolean;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/templates/:template", {
        method: "POST",
        params: { workspace, template },
        body: { sampleData },
      }),
    ),
});
