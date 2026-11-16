import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { MemberApiKeys } from "@/components/workspace/settings/members/member-api-keys";
import { MemberSessions } from "@/components/workspace/settings/members/member-sessions";
import { adminUserQueryOptions } from "@/data/admin/user";
import { adminUserSessionsQueryOptions } from "@/data/admin/user-sessions";
import { memberApiKeysQueryOptions } from "@/data/workspace/member-api-keys";

export const Route = createFileRoute("/workspaces/$workspace/settings/members/$userId/devices")({
  staticData: { crumb: "Devices" },
  beforeLoad: ({ context, params }) => {
    if (context.isSelf)
      throw redirect({ to: "/workspaces/$workspace/settings/members/$userId", params });
  },
  loader: ({ context, params }) =>
    Promise.allSettled([
      context.queryClient.query({
        ...adminUserSessionsQueryOptions(params.userId),
        staleTime: "static",
      }),
      context.queryClient.query({
        ...memberApiKeysQueryOptions(params.workspace, params.userId),
        staleTime: "static",
      }),
    ]),
  component: DevicesPage,
});

function DevicesPage() {
  const { userId } = Route.useParams();
  const { data: member } = useSuspenseQuery(adminUserQueryOptions(userId));
  return (
    <>
      <MemberSessions userId={userId} name={member.name} />
      <MemberApiKeys userId={userId} name={member.name} />
    </>
  );
}
