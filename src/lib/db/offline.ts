import { IndexedDBAdapter, startOfflineExecutor } from "@tanstack/offline-transactions";
import type { OfflineExecutor } from "@tanstack/offline-transactions";
import type { DbClient } from "@tanstack/react-db";

import {
  favoritesCollection,
  SET_FAVORITE,
  setFavoriteMutationFn,
} from "@/data/workspace/favorites";
import {
  createRecordsMutationFn,
  PENDING_RECORDS,
  pendingRecordsCollection,
  RECORDS_MUTATION,
  recordsCollection,
} from "@/data/workspace/records";
import { tablesCollection } from "@/data/workspace/tables";

const PREFIX = "nocosheet-outbox-";

export type OfflineScope = {
  readonly executor: OfflineExecutor;
  ensure: (tableId: number) => Promise<void>;
  dispose: () => void;
};

const executors = new Map<string, Promise<OfflineScope>>();
const swept = new Map<string, Promise<void>>();

const scopeKey = (userId: string, workspace: string) => `${userId}:${workspace}`;
const userPrefix = (userId: string) => `${PREFIX}${userId}-`;
const databaseName = (userId: string, workspace: string) => `${userPrefix(userId)}${workspace}`;

async function removeDatabases(matches: (name: string) => boolean) {
  try {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(
        (database) =>
          new Promise<void>((resolve) => {
            if (!database.name || !matches(database.name)) return resolve();
            const request = indexedDB.deleteDatabase(database.name);
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          }),
      ),
    );
  } catch {
    return;
  }
}

function removeOtherUsers(userId: string) {
  let pending = swept.get(userId);
  if (!pending) {
    pending = removeDatabases(
      (name) => name.startsWith(PREFIX) && !name.startsWith(userPrefix(userId)),
    );
    swept.set(userId, pending);
  }
  return pending;
}

async function createExecutor(
  userId: string,
  workspace: string,
  dbClient: DbClient,
  tableIds: Iterable<number>,
) {
  const favorites = dbClient.collection(favoritesCollection);
  const collections: Record<string, unknown> = {
    favorites,
    [PENDING_RECORDS]: dbClient.collection(pendingRecordsCollection),
  };
  for (const id of tableIds)
    collections[`records:${id}`] = dbClient.collection(recordsCollection(id));
  const executor = startOfflineExecutor({
    collections: collections as never,
    mutationFns: {
      [SET_FAVORITE]: setFavoriteMutationFn(favorites),
      [RECORDS_MUTATION]: createRecordsMutationFn(dbClient) as never,
    },
    storage: new IndexedDBAdapter(databaseName(userId, workspace)),
  });
  await executor.waitForInit().catch(() => undefined);
  return executor;
}

export function openOfflineExecutor(userId: string, workspace: string, dbClient: DbClient) {
  const key = scopeKey(userId, workspace);
  let pending = executors.get(key);
  if (!pending) {
    pending = (async () => {
      await removeOtherUsers(userId);
      const tables = dbClient.collection(tablesCollection);
      await tables.preload().catch(() => undefined);
      const known = new Set<number>(tables.toArray.map((table) => table.id));
      let current = await createExecutor(userId, workspace, dbClient, known);
      let rebuilding: Promise<void> | undefined;

      const scope: OfflineScope = {
        get executor() {
          return current;
        },
        ensure: async (tableId) => {
          await rebuilding;
          if (known.has(tableId)) return;
          known.add(tableId);
          rebuilding = (async () => {
            const previous = current;
            previous.dispose();
            current = await createExecutor(userId, workspace, dbClient, known);
          })();
          await rebuilding;
        },
        dispose: () => current.dispose(),
      };
      return scope;
    })();
    executors.set(key, pending);
  }
  return pending;
}

export async function clearOfflineScope(userId: string, workspace: string) {
  const key = scopeKey(userId, workspace);
  const pending = executors.get(key);
  executors.delete(key);
  (await pending)?.dispose();
  await removeDatabases((name) => name === databaseName(userId, workspace));
}

export async function clearOffline() {
  const open = await Promise.all(executors.values());
  executors.clear();
  swept.clear();
  for (const scope of open) scope.dispose();
  await removeDatabases((name) => name.startsWith(PREFIX));
}
