import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import { type QueryClient, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { CURRENT, writeCurrentRow } from "@/lib/db/current-row";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

import { workspaceKeys } from "./keys";

const fetchProfile = () =>
  fetch("/api/workspaces/:workspace/access/profile", {
    params: { workspace: DEFAULT_WORKSPACE },
  });

export type ProfileRow = { id: string; userId: string } & Awaited<ReturnType<typeof fetchProfile>>;

export const profileQueryOptions = queryOptions({
  queryKey: workspaceKeys.profile(),
  queryFn: fetchProfile,
  staleTime: 30_000,
});

export const profileCollection = createCollection(
  localStorageCollectionOptions<ProfileRow, string>({
    id: "profile",
    storageKey: "nocosheet:profile",
    getKey: (row) => row.id,
  }),
);

export async function loadProfile(queryClient: QueryClient, userId: string) {
  await profileCollection.preload();
  await queryClient
    .query(profileQueryOptions)
    .then((data) => writeCurrentRow(profileCollection, { userId, ...data }))
    .catch(() => undefined);
  const row = profileCollection.get(CURRENT);
  return row?.userId === userId ? row.profile : null;
}
