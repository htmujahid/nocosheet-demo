import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { WorkspaceOverview } from "@/components/workspace/workspace-overview";
import { membersQueryOptions } from "@/data/workspace/members";

export const Route = createFileRoute("/workspaces/$workspace/_core/")({
  loader: ({ context }) => {
    void context.queryClient
      .query({ ...membersQueryOptions, staleTime: "static" })
      .catch(() => undefined);
  },
  component: OverviewPage,
});

function OverviewPage() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent>
        <WorkspaceOverview workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
