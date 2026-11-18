import { createFileRoute, Link } from "@tanstack/react-router";

import { ShieldCheckIcon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { AddMemberDialog } from "@/components/workspace/settings/members/add-member-dialog";
import { MembersList } from "@/components/workspace/settings/members/members-list";
import { membersQueryOptions } from "@/data/workspace/members";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/workspaces/$workspace/settings/members/")({
  loader: ({ context }) => {
    void context.queryClient
      .query({ ...membersQueryOptions, staleTime: "static" })
      .catch(() => undefined);
  },
  component: MembersPage,
});

function MembersPage() {
  const { workspace } = Route.useParams();
  const { isAdmin } = useWorkspace();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        {isAdmin && (
          <>
            <Button
              size="sm"
              variant="outline"
              render={<Link to="/workspaces/$workspace/settings/access" params={{ workspace }} />}
            >
              <ShieldCheckIcon />
              Access profiles
            </Button>
            <AddMemberDialog />
          </>
        )}
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        <MembersList workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
