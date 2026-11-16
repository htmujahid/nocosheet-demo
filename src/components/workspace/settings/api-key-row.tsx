import { KeyRoundIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format-relative-time";

type ApiKeyRowProps = {
  name: string | null;
  start: string | null;
  enabled: boolean | null;
  expiresAt: string | Date | null;
  lastRequest: string | Date | null;
  createdAt: string | Date;
  action: React.ReactNode;
};

export function ApiKeyRow({
  name,
  start,
  enabled,
  expiresAt,
  lastRequest,
  createdAt,
  action,
}: ApiKeyRowProps) {
  const expired = expiresAt !== null && new Date(expiresAt) < new Date();
  return (
    <div className="flex items-center gap-4 p-4 not-last:border-b md:px-6">
      <KeyRoundIcon className="size-5 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-sm">{name || "Unnamed key"}</p>
          {expired && (
            <Badge variant="error" size="sm">
              Expired
            </Badge>
          )}
          {enabled === false && (
            <Badge variant="secondary" size="sm">
              Disabled
            </Badge>
          )}
        </div>
        <p className="truncate text-muted-foreground text-sm">
          <span className="font-mono">{start}…</span>
          {" · Created "}
          {formatRelativeTime(createdAt)}
          {" · "}
          {lastRequest ? `Used ${formatRelativeTime(lastRequest)}` : "Never used"}
          {" · "}
          {expiresAt
            ? `${expired ? "Expired" : "Expires"} ${formatRelativeTime(expiresAt)}`
            : "No expiration"}
        </p>
      </div>
      {action}
    </div>
  );
}
