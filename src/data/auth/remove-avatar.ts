import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/data/workspace/api-error";

import { authKeys } from "./keys";

export const removeAvatarMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("remove-avatar"),
  mutationFn: async () => unwrapFetch(fetch("/api/avatar", { method: "DELETE" })),
});
