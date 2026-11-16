import { createFileRoute } from "@tanstack/react-router";

import { MemberProfile } from "@/components/workspace/settings/members/member-profile";

export const Route = createFileRoute("/workspaces/$workspace/settings/members/$userId/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { userId } = Route.useParams();
  const { isSelf } = Route.useRouteContext();
  return <MemberProfile userId={userId} isSelf={isSelf} />;
}
