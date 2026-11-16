import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsApi } from "@/components/workspace/settings/api";
import { apiKeysQueryOptions } from "@/data/auth/api-keys";

export const Route = createFileRoute("/workspaces/$workspace/settings/api")({
  staticData: { crumb: "API Keys" },
  loader: ({ context }) =>
    context.queryClient.query({ ...apiKeysQueryOptions, staleTime: "static" }),
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsApi />
      </WorkspaceContent>
    </>
  );
}
