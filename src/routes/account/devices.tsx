import { createFileRoute } from "@tanstack/react-router";

import { LinkedAccounts } from "@/components/account/linked-accounts";
import { SessionsList } from "@/components/account/sessions-list";
import { useSession } from "@/hooks/use-session";
import { sessionsQueryOptions } from "@/data/auth/sessions";

export const Route = createFileRoute("/account/devices")({
  loader: ({ context }) => {
    void context.queryClient.query({ ...sessionsQueryOptions, staleTime: "static" }).catch(() => undefined);
  },
  component: DevicesPage,
});

function DevicesPage() {
  const session = useSession();

  return (
    <>
      <SessionsList currentSessionId={session!.session.id} />
      <LinkedAccounts />
    </>
  );
}
