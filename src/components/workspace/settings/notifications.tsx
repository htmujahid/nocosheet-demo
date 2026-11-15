import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";

export function SettingsNotifications() {
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Notifications</CardFrameTitle>
        <CardFrameDescription>Choose what you hear about, and how.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Activity"
          description="Notifications about changes to the tables and records you follow will appear here, in the app and by email."
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
