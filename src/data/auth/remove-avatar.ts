import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";

import { authKeys } from "./keys";

export const removeAvatarMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("remove-avatar"),
  mutationFn: async () => unwrapFetch(fetch("/api/avatar", { method: "DELETE" })),
});
