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
import type { ColumnInput, ColumnPatchInput } from "@/lib/tables/validation";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

import { workspaceKeys } from "./keys";
import { syncRows } from "./sync-state";

const fetchColumnRows = (tableId: number) =>
  unwrapFetch(
    fetch("/api/workspaces/:workspace/tables/:table/columns", {
      params: { workspace: DEFAULT_WORKSPACE, table: String(tableId) },
    }),
  );

export type ColumnRow = Awaited<ReturnType<typeof fetchColumnRows>>[number];

const createColumnsCollection = (tableId: number) =>
  collectionOptions(`columns:${tableId}`, (client) => {
    const source = queryCollectionOptions({
      id: `columns:${tableId}`,
      queryKey: workspaceKeys.tableColumns(tableId),
      queryClient: client.requireDependency<QueryClient>("queryClient"),
      queryFn: () => syncRows(client, `columns:${tableId}`, () => fetchColumnRows(tableId)),
      getKey: (column) => column.id,
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

const columnCollections = new Map<number, ReturnType<typeof createColumnsCollection>>();

export function columnsCollection(tableId: number) {
  let descriptor = columnCollections.get(tableId);
  if (!descriptor) {
    descriptor = createColumnsCollection(tableId);
    columnCollections.set(tableId, descriptor);
  }
  return descriptor;
}

export const createColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-column"),
  mutationFn: ({ workspace, id, column }: { workspace: string; id: number; column: ColumnInput }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns", {
        method: "POST",
        params: { workspace, table: String(id) },
        body: column,
      }),
    ),
});

export const updateColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-column"),
  mutationFn: ({
    workspace,
    id,
    columnId,
    patch,
  }: {
    workspace: string;
    id: number;
    columnId: number;
    patch: ColumnPatchInput;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/:column", {
        method: "PATCH",
        params: { workspace, table: String(id), column: String(columnId) },
        body: patch,
      }),
    ),
});

export const reorderColumnsMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("reorder-columns"),
  mutationFn: ({ workspace, id, ids }: { workspace: string; id: number; ids: number[] }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/order", {
        method: "PUT",
        params: { workspace, table: String(id) },
        body: { ids },
      }),
    ),
});

export const deleteColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-column"),
  mutationFn: ({ workspace, id, columnId }: { workspace: string; id: number; columnId: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/:column", {
        method: "DELETE",
        params: { workspace, table: String(id), column: String(columnId) },
      }),
    ),
});

export const deletedColumnsQueryOptions = (workspace: string, id: number) =>
  queryOptions({
    queryKey: workspaceKeys.columnsTrash(id),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/columns/trash", {
          params: { workspace, table: String(id) },
        }),
      ),
  });

export const restoreColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("restore-column"),
  mutationFn: ({ workspace, id, columnId }: { workspace: string; id: number; columnId: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/:column/restore", {
        method: "POST",
        params: { workspace, table: String(id), column: String(columnId) },
      }),
    ),
});
