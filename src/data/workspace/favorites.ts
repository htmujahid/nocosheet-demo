import {
  persistedCollectionOptions,
  type PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";
import { NonRetriableError, type OfflineExecutor } from "@tanstack/offline-transactions";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { collectionOptions } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";

import { fetch, FetchError } from "void/client";

import { unwrapFetch } from "@/lib/api-error";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

const fetchFavoriteRows = () =>
  unwrapFetch(
    fetch("/api/workspaces/:workspace/favorites", { params: { workspace: DEFAULT_WORKSPACE } }),
  );

import { workspaceKeys } from "./keys";
import { syncRows } from "./sync-state";

export type FavoriteRow = Awaited<ReturnType<typeof fetchFavoriteRows>>[number];

export const favoritesCollection = collectionOptions("favorites", (client) => {
  const source = queryCollectionOptions({
    id: "favorites",
    queryKey: workspaceKeys.favorites(),
    queryClient: client.requireDependency<QueryClient>("queryClient"),
    queryFn: () => syncRows(client, "favorites", fetchFavoriteRows),
    getKey: (favorite) => favorite.tableId,
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

type FavoritesCollection = {
  insert: (row: FavoriteRow) => unknown;
  delete: (key: number) => unknown;
  utils: Record<string, any>;
};

export const SET_FAVORITE = "setFavorite";

const PERMANENT_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

const rejectPermanent = (error: unknown): never => {
  if (error instanceof FetchError && error.status && PERMANENT_STATUSES.has(error.status))
    throw new NonRetriableError(error.message);
  throw error;
};

export const setFavoriteMutationFn =
  (favorites: FavoritesCollection) =>
  async ({ transaction }: { transaction: { mutations: { type: string; key: unknown }[] } }) => {
    for (const mutation of transaction.mutations) {
      const params = { workspace: DEFAULT_WORKSPACE, table: String(mutation.key) };
      if (mutation.type === "delete") {
        await fetch("/api/workspaces/:workspace/tables/:table/favorite", {
          method: "DELETE",
          params,
        }).catch(rejectPermanent);
        favorites.utils.writeDelete(Number(mutation.key));
      } else {
        const row = await fetch("/api/workspaces/:workspace/tables/:table/favorite", {
          method: "PUT",
          params,
        }).catch(rejectPermanent);
        favorites.utils.writeUpsert(row as FavoriteRow);
      }
    }
  };

export const setFavoriteAction = (
  executor: OfflineExecutor,
  favorites: FavoritesCollection,
  userId: string,
) =>
  executor.createOfflineAction<{ tableId: number; favorite: boolean }>({
    mutationFnName: SET_FAVORITE,
    onMutate: ({ tableId, favorite }) => {
      if (favorite)
        favorites.insert({ id: -tableId, userId, tableId, createdAt: new Date().toISOString() });
      else favorites.delete(tableId);
    },
  });
