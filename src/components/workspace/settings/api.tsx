import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { API_KEY_HEADER } from "@/lib/auth/api-keys";

import { ApiKeysCard } from "./api-keys-card";

export function SettingsApi() {
  const { id: workspace } = useWorkspace();
  const example = `curl -H "${API_KEY_HEADER}: YOUR_KEY" \\\n  ${window.location.origin}/api/workspaces/${workspace}/me`;

  return (
    <div className="flex flex-col gap-6">
      <ApiKeysCard />
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Documentation</CardFrameTitle>
          <CardFrameDescription>
            Send your key in the {API_KEY_HEADER} header to call the workspace API.
          </CardFrameDescription>
          <CardFrameAction>
            <Button
              variant="outline"
              render={<a href="/api/docs" target="_blank" rel="noreferrer" />}
            >
              View docs
              <ExternalLinkIcon />
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Card>
          <div className="flex flex-col gap-3 p-4 md:px-6">
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {example}
            </pre>
            <p className="text-muted-foreground text-xs">
              Requests are limited per key. A key only works with the workspace API, not with
              sign-in or account endpoints.
            </p>
          </div>
        </Card>
      </CardFrame>
    </div>
  );
}
