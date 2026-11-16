import { useSuspenseQuery } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { apiKeysQueryOptions } from "@/data/auth/api-keys";
import { useWorkspace } from "@/hooks/use-workspace";

import { ApiKeyRow } from "./api-key-row";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { RevokeApiKeyDialog } from "./revoke-api-key-dialog";

export function ApiKeysCard() {
  const { isAdmin } = useWorkspace();
  const { data } = useSuspenseQuery(apiKeysQueryOptions);
  const keys = data.apiKeys;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>API keys</CardFrameTitle>
        <CardFrameDescription>
          {isAdmin
            ? "Keys act as you, with full administrator access."
            : "Keys act as you, with your role and access profile."}
        </CardFrameDescription>
        <CardFrameAction>
          <CreateApiKeyDialog />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        {keys.length === 0 ? (
          <SettingsRow
            title="No API keys yet"
            description="Create one to call the API from a script or another tool."
          />
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
              action={<RevokeApiKeyDialog keyId={key.id} name={key.name || "Unnamed key"} />}
            />
          ))
        )}
      </Card>
    </CardFrame>
  );
}
