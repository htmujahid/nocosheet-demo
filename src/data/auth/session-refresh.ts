import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { sessionQueryOptions, loadSession } from "./session";

export function useRefreshSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async ({ signedOut = false } = {}) => {
    if (signedOut) queryClient.removeQueries();
    await queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey });
    await loadSession(queryClient);
    await router.invalidate();
  };
}
