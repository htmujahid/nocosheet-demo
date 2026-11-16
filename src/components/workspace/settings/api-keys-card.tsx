import { useSuspenseQuery } from "@tanstack/react-query";

import { KeyRoundIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
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
import { formatRelativeTime } from "@/lib/format-relative-time";

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
            : "Keys act as you, with your role and table permissions."}
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
          keys.map((key) => {
            const expired = key.expiresAt !== null && new Date(key.expiresAt) < new Date();
            return (
              <div key={key.id} className="flex items-center gap-4 p-4 not-last:border-b md:px-6">
                <KeyRoundIcon className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">{key.name || "Unnamed key"}</p>
                    {expired && (
                      <Badge variant="error" size="sm">
                        Expired
                      </Badge>
                    )}
                    {key.enabled === false && (
                      <Badge variant="secondary" size="sm">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-muted-foreground text-sm">
                    <span className="font-mono">{key.start}…</span>
                    {" · Created "}
                    {formatRelativeTime(key.createdAt)}
                    {" · "}
                    {key.lastRequest ? `Used ${formatRelativeTime(key.lastRequest)}` : "Never used"}
                    {" · "}
                    {key.expiresAt
                      ? `${expired ? "Expired" : "Expires"} ${formatRelativeTime(key.expiresAt)}`
                      : "No expiration"}
                  </p>
                </div>
                <RevokeApiKeyDialog keyId={key.id} name={key.name || "Unnamed key"} />
              </div>
            );
          })
        )}
      </Card>
    </CardFrame>
  );
}
