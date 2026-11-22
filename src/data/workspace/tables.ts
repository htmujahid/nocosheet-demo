import {
  persistedCollectionOptions,
  type PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { collectionOptions } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";
import type { TableInput, TableUpdateInput } from "@/lib/tables/validation";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

import { workspaceKeys } from "./keys";
import { syncRows } from "./sync-state";

const fetchTableRows = () =>
  unwrapFetch(
    fetch("/api/workspaces/:workspace/tables", { params: { workspace: DEFAULT_WORKSPACE } }),
  );

export type TableRow = Awaited<ReturnType<typeof fetchTableRows>>[number];

export const tablesCollection = collectionOptions("tables", (client) => {
  const source = queryCollectionOptions({
    id: "tables",
    queryKey: workspaceKeys.tableRows(),
    queryClient: client.requireDependency<QueryClient>("queryClient"),
    queryFn: () => syncRows(client, "tables", fetchTableRows),
    getKey: (table) => table.id,
    staleTime: 5 * 60_000,
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

export function groupTables<T extends { groupName: string | null }>(tables: T[]) {
  const groups = new Map<string | null, T[]>();
  for (const table of tables) {
    const bucket = groups.get(table.groupName);
    if (bucket) bucket.push(table);
    else groups.set(table.groupName, [table]);
  }
  return [...groups.entries()]
    .map(([name, items]) => ({ name, tables: items }))
    .sort((a, b) => {
      if (a.name === null) return -1;
      if (b.name === null) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

export const createTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-table"),
  mutationFn: ({ workspace, ...values }: { workspace: string } & TableInput) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables", {
        method: "POST",
        params: { workspace },
        body: values,
      }),
    ),
});

export const updateTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-table"),
  mutationFn: ({
    workspace,
    id,
    values,
  }: {
    workspace: string;
    id: number;
    values: TableUpdateInput;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table", {
        method: "PATCH",
        params: { workspace, table: String(id) },
        body: values,
      }),
    ),
});

export const deleteTablesMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-tables"),
  mutationFn: ({ workspace, ids }: { workspace: string; ids: number[] }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables", {
        method: "DELETE",
        params: { workspace },
        body: { ids },
      }),
    ),
});

export const deletedTablesQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.tablesTrash(),
    queryFn: () =>
      unwrapFetch(fetch("/api/workspaces/:workspace/tables/trash", { params: { workspace } })),
    retry: false,
  });

export const restoreTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("restore-table"),
  mutationFn: ({ workspace, id }: { workspace: string; id: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/restore", {
        method: "POST",
        params: { workspace, table: String(id) },
      }),
    ),
});
