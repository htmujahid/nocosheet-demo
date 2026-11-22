import {
  persistedCollectionOptions,
  type PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { collectionOptions } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";

import { fetch } from "void/client";

import { type AccessGrant, actionOf } from "@/lib/access/grants";
import { unwrapFetch } from "@/lib/api-error";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

import { workspaceKeys } from "./keys";
import { syncRows } from "./sync-state";

export type GrantRow = AccessGrant & { id: string };

const fetchGrantRows = async (): Promise<GrantRow[]> => {
  const { rows } = await unwrapFetch(
    fetch("/api/workspaces/:workspace/access/grants", {
      params: { workspace: DEFAULT_WORKSPACE },
    }),
  );
  return rows.map((grant) => ({
    ...grant,
    id: `${grant.resourceId ?? 0}:${actionOf(grant.grant)}`,
  }));
};

export const grantsCollection = collectionOptions("grants", (client) => {
  const source = queryCollectionOptions({
    id: "grants",
    queryKey: workspaceKeys.grants(),
    queryClient: client.requireDependency<QueryClient>("queryClient"),
    queryFn: () => syncRows(client, "grants", fetchGrantRows),
    getKey: (row) => row.id,
    staleTime: 30_000,
  });
  const persistence = client.getDependency<PersistedCollectionPersistence>("persistence");
  if (!persistence) return source;
  return persistedCollectionOptions({
    ...source,
    persistence,
    schemaVersion: 1,
    initialRender: { strategy: "network-first", networkTimeoutMs: 3000 },
  }) as unknown as typeof source;
});
