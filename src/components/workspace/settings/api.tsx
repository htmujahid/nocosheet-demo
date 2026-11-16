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

const rowClassName = "flex flex-col gap-3 p-4 not-last:border-b md:px-6";
const codeClassName = "overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs";

export function SettingsApi() {
  const { id: workspace } = useWorkspace();
  const base = window.location.origin;
  const example = `curl -H "${API_KEY_HEADER}: YOUR_KEY" \\\n  ${base}/api/workspaces/${workspace}/me`;
  const signIn = `# Sign in as a user and read the token from the set-auth-token header\ncurl -i -X POST ${base}/api/auth/sign-in/email \\\n  -H "content-type: application/json" \\\n  -d '{"email":"you@example.com","password":"..."}'\n\n# Use it on later requests\ncurl -H "Authorization: Bearer TOKEN" \\\n  ${base}/api/workspaces/${workspace}/me`;

  return (
    <div className="flex flex-col gap-6">
      <ApiKeysCard />
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Documentation</CardFrameTitle>
          <CardFrameDescription>
            Two ways to call the workspace API from your own tools.
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
          <div className={rowClassName}>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-sm">With an API key</p>
              <p className="text-muted-foreground text-sm">
                Send your key in the {API_KEY_HEADER} header. Requests are limited per key, and a
                key only works with the workspace API, not with sign-in or account endpoints.
              </p>
            </div>
            <pre className={codeClassName}>{example}</pre>
          </div>
          <div className={rowClassName}>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-sm">Signing in from your own app</p>
              <p className="text-muted-foreground text-sm">
                For apps where each person signs in as themselves, such as a mobile app. A token is
                a full sign-in, so keep it in secure storage. Signing out revokes it.
              </p>
            </div>
            <pre className={codeClassName}>{signIn}</pre>
          </div>
        </Card>
      </CardFrame>
    </div>
  );
}
