import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useWorkspace } from "@/hooks/use-workspace";
import { API_KEY_HEADER } from "@/lib/auth/api-keys";

import { ApiKeysCard } from "./api-keys-card";

export function SettingsApi() {
  const { id: workspace } = useWorkspace();
  const base = window.location.origin;
  const example = `curl -H "${API_KEY_HEADER}: YOUR_KEY" \\\n  ${base}/api/workspaces/${workspace}/me`;
  const signIn = `# Sign in as a user and read the token from the set-auth-token header\ncurl -i -X POST ${base}/api/auth/sign-in/email \\\n  -H "content-type: application/json" \\\n  -d '{"email":"you@example.com","password":"..."}'\n\n# Use it on later requests\ncurl -H "Authorization: Bearer TOKEN" \\\n  ${base}/api/workspaces/${workspace}/me`;

  return (
    <div className="flex flex-col gap-6">
      <ApiKeysCard />
      <Frame>
        <FrameHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <FrameTitle>Documentation</FrameTitle>
            <FrameDescription>
              Two ways to call the workspace API from your own tools.
            </FrameDescription>
          </div>
          <Button
            variant="outline"
            render={<a href="/api/docs" target="_blank" rel="noreferrer" />}
          >
            View docs
            <ExternalLinkIcon />
          </Button>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-semibold text-sm">With an API key</h3>
            <p className="text-muted-foreground text-sm">
              Send your key in the {API_KEY_HEADER} header. Requests are limited per key, and a key
              only works with the workspace API, not with sign-in or account endpoints.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">{example}</pre>
        </FramePanel>
        <FramePanel className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-semibold text-sm">Signing in from your own app</h3>
            <p className="text-muted-foreground text-sm">
              For apps where each person signs in as themselves, such as a mobile app. A token is a
              full sign-in, so keep it in secure storage. Signing out revokes it.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">{signIn}</pre>
        </FramePanel>
      </Frame>
    </div>
  );
}
