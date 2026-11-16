import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const signInMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("sign-in"),
  mutationFn: async ({ identifier, password }: { identifier: string; password: string }) =>
    unwrapAuthResult(
      identifier.includes("@")
        ? await auth.signIn.email({ email: identifier, password })
        : await auth.signIn.username({ username: identifier, password }),
    ),
});
