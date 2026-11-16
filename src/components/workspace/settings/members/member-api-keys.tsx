import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  memberApiKeysQueryOptions,
  revokeMemberApiKeyMutationOptions,
} from "@/data/workspace/member-api-keys";
import { useWorkspace } from "@/hooks/use-workspace";

import { ApiKeyRow } from "../api-key-row";
import { ConfirmAction } from "./confirm-action";

export function MemberApiKeys({ userId, name }: { userId: string; name: string }) {
  const { id: workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { data: keys } = useSuspenseQuery(memberApiKeysQueryOptions(workspace, userId));

  const revoke = useMutation({
    ...revokeMemberApiKeyMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.memberApiKeys(userId) });
      toastManager.add({ type: "success", title: "API key revoked" });
    },
    onError: (error) =>
      toastManager.add({ type: "error", title: "Couldn't revoke", description: error.message }),
  });

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>API keys</CardFrameTitle>
        <CardFrameDescription>
          Keys {name} created. Each one acts as them, with their role and access profile.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        {keys.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground text-sm">No API keys.</p>
        ) : (
          keys.map((key) => (
            <ApiKeyRow
              key={key.id}
              name={key.name}
              start={key.start}
              enabled={key.enabled}
              expiresAt={key.expiresAt}
              lastRequest={key.lastRequest}
              createdAt={key.createdAt}
              action={
                <ConfirmAction
                  label="Revoke"
                  title={`Revoke "${key.name || "Unnamed key"}"?`}
                  description="Anything using this key stops working immediately. This can't be undone."
                  confirmLabel="Revoke key"
                  destructive
                  pending={revoke.isPending && revoke.variables?.keyId === key.id}
                  onConfirm={() => revoke.mutateAsync({ workspace, userId, keyId: key.id })}
                />
              }
            />
          ))
        )}
      </Card>
    </CardFrame>
  );
}
