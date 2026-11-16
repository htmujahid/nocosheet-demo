import { createFileRoute, redirect } from "@tanstack/react-router";

import { MemberStatus } from "@/components/workspace/settings/members/member-status";
import { MemberSecurity } from "@/components/workspace/settings/members/member-security";

export const Route = createFileRoute("/workspaces/$workspace/settings/members/$userId/security")({
  staticData: { crumb: "Security" },
  beforeLoad: ({ context, params }) => {
    if (context.isSelf)
      throw redirect({ to: "/workspaces/$workspace/settings/members/$userId", params });
  },
  component: SecurityPage,
});

function SecurityPage() {
  const { userId } = Route.useParams();
  return (
    <>
      <MemberSecurity userId={userId} />
      <MemberStatus userId={userId} />
    </>
  );
}
