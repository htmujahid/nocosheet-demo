import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";

import { authKeys } from "./keys";

export const uploadAvatarMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("upload-avatar"),
  mutationFn: async (file: File) => {
    const body = new FormData();
    body.set("file", file);
    return unwrapFetch(fetch("/api/avatar", { method: "POST", body }));
  },
});
