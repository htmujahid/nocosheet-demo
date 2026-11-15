import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";

export function SettingsAuditLog() {
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Audit log</CardFrameTitle>
        <CardFrameDescription>
          A history of who changed what in this workspace, for administrators.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Activity"
          description="Record changes, deletes and restores, table, view and form changes, and role and member changes will appear here."
          badge={
            <Badge variant="secondary" size="sm">
              Coming soon
            </Badge>
          }
        />
      </Card>
    </CardFrame>
  );
}
