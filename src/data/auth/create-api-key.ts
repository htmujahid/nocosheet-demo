import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const createApiKeyMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("create-api-key"),
  mutationFn: async (values: { name: string; expiresIn?: number }) =>
    unwrapAuthResult(await auth.apiKey.create(values)),
});
