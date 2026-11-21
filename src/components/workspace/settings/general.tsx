import { useLiveSuspenseQuery } from "@tanstack/react-db";

import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { membersCollection } from "@/data/workspace/members";
import { useWorkspace } from "@/hooks/use-workspace";
import { DEFAULT_WORKSPACE, DEFAULT_WORKSPACE_NAME } from "@/lib/workspace";

export function SettingsGeneral() {
  const { isAdmin: admin } = useWorkspace();
  const { data: members } = useLiveSuspenseQuery({
    query: (q) => q.from({ member: membersCollection }),
  });

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Workspace</CardFrameTitle>
        <CardFrameDescription>
          This instance has a single workspace shared by everyone who signs up.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow title="Name" description="How the workspace is labelled in the app.">
          <span className="text-sm">{DEFAULT_WORKSPACE_NAME}</span>
        </SettingsRow>
        <SettingsRow title="Address" description="The workspace's URL segment.">
          <code className="font-mono text-sm">/workspaces/{DEFAULT_WORKSPACE}</code>
        </SettingsRow>
        <SettingsRow title="Members" description="Accounts with access to this workspace.">
          <span className="text-sm">{members.length}</span>
        </SettingsRow>
        <SettingsRow
          title="Your role"
          description="Your access level in this workspace."
          badge={
            <Badge variant={admin ? "info" : "secondary"} size="sm">
              {admin ? "Admin" : "Member"}
            </Badge>
          }
        />
      </Card>
    </CardFrame>
  );
}
