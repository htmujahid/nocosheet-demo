import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { MemberSessions } from "@/components/workspace/settings/members/member-sessions";
import { adminUserQueryOptions } from "@/data/admin/user";
import { adminUserSessionsQueryOptions } from "@/data/admin/user-sessions";

export const Route = createFileRoute("/workspaces/$workspace/settings/members/$userId/devices")({
  staticData: { crumb: "Devices" },
  beforeLoad: ({ context, params }) => {
    if (context.isSelf)
      throw redirect({ to: "/workspaces/$workspace/settings/members/$userId", params });
  },
  loader: ({ context, params }) => {
    void context.queryClient
      .query({ ...adminUserSessionsQueryOptions(params.userId), staleTime: "static" })
      .catch(() => undefined);
  },
  component: DevicesPage,
});

function DevicesPage() {
  const { userId } = Route.useParams();
  const { data: member } = useSuspenseQuery(adminUserQueryOptions(userId));
  return <MemberSessions userId={userId} name={member.name} />;
}
