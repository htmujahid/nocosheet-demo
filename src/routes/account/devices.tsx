import { createFileRoute } from "@tanstack/react-router";

import { LinkedAccounts } from "@/components/account/linked-accounts";
import { SessionsList } from "@/components/account/sessions-list";
import { sessionsQueryOptions } from "@/data/auth/sessions";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/account/devices")({
  loader: ({ context }) => {
    void context.queryClient
      .query({ ...sessionsQueryOptions, staleTime: "static" })
      .catch(() => undefined);
  },
  component: DevicesPage,
});

function DevicesPage() {
  const session = useSession();

  if (!session) return null;

  return (
    <>
      <SessionsList currentSessionId={session.session.id} />
      <LinkedAccounts />
    </>
  );
}
