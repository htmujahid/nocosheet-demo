import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const memberApiKeysQueryOptions = (workspace: string, userId: string) =>
  queryOptions({
    queryKey: workspaceKeys.memberApiKeys(userId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/members/:member/api-keys", {
          params: { workspace, member: userId },
        }),
      ),
    staleTime: 10_000,
    retry: false,
  });

export const revokeMemberApiKeyMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("revoke-member-api-key"),
  mutationFn: ({
    workspace,
    userId,
    keyId,
  }: {
    workspace: string;
    userId: string;
    keyId: string;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/members/:member/api-keys/:key", {
        method: "DELETE",
        params: { workspace, member: userId, key: keyId },
      }),
    ),
});
