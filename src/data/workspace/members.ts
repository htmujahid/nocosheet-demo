import {
  persistedCollectionOptions,
  type PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { collectionOptions } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { workspaceKeys } from "./keys";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean;
  createdAt: number;
};

async function listMembers(): Promise<MemberRow[]> {
  const { users } = unwrapAuthResult(
    await auth.admin.listUsers({
      query: { limit: 500, sortBy: "name", sortDirection: "asc" },
    }),
  );
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role ?? null,
    banned: Boolean(user.banned),
    createdAt: new Date(user.createdAt).getTime(),
  }));
}

export const membersCollection = collectionOptions("members", (client) => {
  const source = queryCollectionOptions({
    id: "members",
    queryKey: workspaceKeys.members(),
    queryClient: client.requireDependency<QueryClient>("queryClient"),
    queryFn: listMembers,
    getKey: (member) => member.id,
    staleTime: 30_000,
  });
  const persistence = client.getDependency<PersistedCollectionPersistence>("persistence");
  if (!persistence) return source;
  return persistedCollectionOptions({
    ...source,
    persistence,
    schemaVersion: 1,
    initialRender: { strategy: "network-first", networkTimeoutMs: 0 },
  }) as unknown as typeof source;
});
