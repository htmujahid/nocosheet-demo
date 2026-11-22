import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import { type QueryClient, queryOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";
import { CURRENT, writeCurrentRow } from "@/lib/db/current-row";
import { type Jsonified, toJson } from "@/lib/db/json";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

async function fetchSession() {
  const data = unwrapAuthResult(await auth.getSession());
  if (!data) return null;
  const { token: _token, ...session } = data.session;
  return { session, user: data.user };
}

type SessionData = NonNullable<Awaited<ReturnType<typeof fetchSession>>>;

export type SessionRow = { id: string } & Jsonified<SessionData>;

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session(),
  queryFn: fetchSession,
  staleTime: 60_000,
});

export const sessionCollection = createCollection(
  localStorageCollectionOptions<SessionRow, string>({
    id: "session",
    storageKey: "nocosheet:session",
    getKey: (row) => row.id,
  }),
);

export async function loadSession(queryClient: QueryClient) {
  await sessionCollection.preload();
  await queryClient
    .query(sessionQueryOptions)
    .then((data) => writeCurrentRow(sessionCollection, data && toJson(data)))
    .catch(() => undefined);
  return sessionCollection.get(CURRENT) ?? null;
}
