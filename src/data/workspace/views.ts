import {
  persistedCollectionOptions,
  type PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { collectionOptions } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";
import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";
import type { ViewInput, ViewPatchInput } from "@/lib/views/validation";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

import { workspaceKeys } from "./keys";
import { syncRows } from "./sync-state";

const fetchViewRows = (tableId: number) =>
  unwrapFetch(
    fetch("/api/workspaces/:workspace/tables/:table/views", {
      params: { workspace: DEFAULT_WORKSPACE, table: String(tableId) },
    }),
  );

export type ViewRow = Awaited<ReturnType<typeof fetchViewRows>>[number];

const createViewsCollection = (tableId: number) =>
  collectionOptions(`views:${tableId}`, (client) => {
    const source = queryCollectionOptions({
      id: `views:${tableId}`,
      queryKey: workspaceKeys.views(tableId),
      queryClient: client.requireDependency<QueryClient>("queryClient"),
      queryFn: () => syncRows(client, `views:${tableId}`, () => fetchViewRows(tableId)),
      getKey: (view) => view.id,
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

const viewCollections = new Map<number, ReturnType<typeof createViewsCollection>>();

export function viewsCollection(tableId: number) {
  let descriptor = viewCollections.get(tableId);
  if (!descriptor) {
    descriptor = createViewsCollection(tableId);
    viewCollections.set(tableId, descriptor);
  }
  return descriptor;
}

export const createViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-view"),
  mutationFn: ({
    workspace,
    tableId,
    ...values
  }: { workspace: string; tableId: number } & ViewInput) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/views", {
        method: "POST",
        params: { workspace, table: String(tableId) },
        body: values,
      }),
    ),
});

export const updateViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-view"),
  mutationFn: ({
    workspace,
    tableId,
    viewId,
    ...values
  }: { workspace: string; tableId: number; viewId: number } & ViewPatchInput) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/views/:view", {
        method: "PATCH",
        params: { workspace, table: String(tableId), view: String(viewId) },
        body: values,
      }),
    ),
});

export const deleteViewsMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-views"),
  mutationFn: ({
    workspace,
    tableId,
    ids,
  }: {
    workspace: string;
    tableId: number;
    ids: number[];
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/views", {
        method: "DELETE",
        params: { workspace, table: String(tableId) },
        body: { ids },
      }),
    ),
});

export const deleteViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-view"),
  mutationFn: ({
    workspace,
    tableId,
    viewId,
  }: {
    workspace: string;
    tableId: number;
    viewId: number;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/views/:view", {
        method: "DELETE",
        params: { workspace, table: String(tableId), view: String(viewId) },
      }),
    ),
});
