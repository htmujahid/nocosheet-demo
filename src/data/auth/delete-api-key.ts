import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const deleteApiKeyMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("delete-api-key"),
  mutationFn: async (values: { keyId: string }) =>
    unwrapAuthResult(await auth.apiKey.delete(values)),
});
