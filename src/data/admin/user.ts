import { queryOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { adminKeys } from "./keys";

export const adminUserQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: adminKeys.user(userId),
    queryFn: async () => {
      const user = unwrapAuthResult(await auth.admin.getUser({ query: { id: userId } }));
      const { twoFactorEnabled } = user as { twoFactorEnabled?: boolean | null };
      return { ...user, twoFactorEnabled: Boolean(twoFactorEnabled) };
    },
    staleTime: 15_000,
  });
