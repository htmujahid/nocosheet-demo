import { queryOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const apiKeysQueryOptions = queryOptions({
  queryKey: authKeys.apiKeys(),
  queryFn: async () =>
    unwrapAuthResult(
      await auth.apiKey.list({ query: { sortBy: "createdAt", sortDirection: "desc" } }),
    ),
  staleTime: 30_000,
});
