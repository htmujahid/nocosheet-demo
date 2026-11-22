import {
  persistedCollectionOptions,
  type PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";
import { collectionOptions, localOnlyCollectionOptions } from "@tanstack/react-db";
import type { DbClient } from "@tanstack/react-db";

import { isNetworkError } from "@/lib/api-error";

export type SyncStateRow = { id: string; count: number };

export const syncStateCollection = collectionOptions("syncState", (client) => {
  const source = localOnlyCollectionOptions({
    id: "syncState",
    getKey: (row: SyncStateRow) => row.id,
  });
  const persistence = client.getDependency<PersistedCollectionPersistence>("persistence");
  if (!persistence) return source;
  return persistedCollectionOptions<SyncStateRow, string>({
    id: "syncState",
    getKey: (row) => row.id,
    persistence,
    schemaVersion: 1,
  }) as unknown as typeof source;
});

async function readCount(client: DbClient, id: string) {
  const state = client.collection(syncStateCollection);
  await state.preload();
  return state.get(id)?.count;
}

async function writeCount(client: DbClient, id: string, count: number) {
  const state = client.collection(syncStateCollection);
  await state.preload();
  if (state.get(id)?.count === count) return;
  const transaction = state.has(id)
    ? state.update(id, (draft) => {
        draft.count = count;
      })
    : state.insert({ id, count });
  void transaction.when("settled").catch(() => undefined);
}

export async function syncRows<T>(client: DbClient, id: string, load: () => Promise<T[]>) {
  let rows: T[];
  try {
    rows = await load();
  } catch (error) {
    if (isNetworkError(error) && (await readCount(client, id).catch(() => undefined)) === 0)
      return [];
    throw error;
  }
  await writeCount(client, id, rows.length);
  return rows;
}
