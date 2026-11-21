import { createFileRoute, redirect } from "@tanstack/react-router";

import { MemberSecurity } from "@/components/workspace/settings/members/member-security";
import { MemberStatus } from "@/components/workspace/settings/members/member-status";

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
