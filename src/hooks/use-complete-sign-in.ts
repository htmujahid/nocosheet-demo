import { useRouter, useSearch } from "@tanstack/react-router";

import { useRefreshSession } from "@/data/auth/session-refresh";

export function useCompleteSignIn() {
  const refreshSession = useRefreshSession();
  const router = useRouter();
  const { redirect } = useSearch({ from: "/auth" });

  return async () => {
    await refreshSession();
    router.history.push(redirect ?? "/");
  };
}
