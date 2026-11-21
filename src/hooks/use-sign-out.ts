import { useMutation } from "@tanstack/react-query";

import { useRefreshSession } from "@/data/auth/session-refresh";
import { signOutMutationOptions } from "@/data/auth/sign-out";
import { profileCollection } from "@/data/workspace/profile";
import { clearDbClients } from "@/lib/db/client";
import { writeCurrentRow } from "@/lib/db/current-row";

export function useSignOut() {
  const refreshSession = useRefreshSession();

  return useMutation({
    ...signOutMutationOptions,
    onSuccess: async () => {
      await refreshSession({ signedOut: true });
      await profileCollection.preload();
      await writeCurrentRow(profileCollection, null);
      await clearDbClients();
      window.location.assign("/auth/sign-in");
    },
  });
}
