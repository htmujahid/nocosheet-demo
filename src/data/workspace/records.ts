import {
  persistedCollectionOptions,
  type PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";
import { NonRetriableError, type OfflineExecutor } from "@tanstack/offline-transactions";
import { collectionOptions, localOnlyCollectionOptions, type DbClient } from "@tanstack/react-db";

import { fetch, FetchError } from "void/client";

import { toastManager } from "@/components/ui/toast";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { shapeSyncRow } from "@/lib/records/shape";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

import { columnsCollection } from "./columns";

export type RecordRow = {
  id: number;
  created_at: number;
  updated_at: number;
  created_by: string | null;
  updated_by: string | null;
  created_by_label: string | null;
  updated_by_label: string | null;
  [column: string]: unknown;
};

export const SYSTEM_FIELDS = [
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "created_by_label",
  "updated_by_label",
];

export const recordsCollectionId = (tableId: number) => `records:${tableId}`;

export const tableIdOfCollection = (id: string) => {
  const match = /^records:(\d+)$/.exec(id);
  return match ? Number(match[1]) : undefined;
};

const CURSOR_KEY = "cursor";
const MAX_CURSOR_AGE_MS = (TRASH_RETENTION_DAYS - 1) * 24 * 60 * 60 * 1000;
const REFRESH_AFTER_MS = 30_000;

const fetchRecords = async (tableId: number, since?: number) => {
  const result = await fetch("/api/workspaces/:workspace/tables/:table/records", {
    params: { workspace: DEFAULT_WORKSPACE, table: String(tableId) },
    query: since === undefined ? {} : { since },
  });
  return result as unknown as {
    rows: Record<string, unknown>[];
    syncedAt: number;
  };
};

type RecordsUtils = {
  pull: () => Promise<void>;
};

const createRecordsCollection = (tableId: number) => {
  const id = recordsCollectionId(tableId);
  return collectionOptions(id, (client) => {
    const persistence = client.getDependency<PersistedCollectionPersistence>("persistence");
    const controller: RecordsUtils = { pull: async () => {} };
    const utils: RecordsUtils = {
      pull: () => controller.pull(),
    };

    const sync = {
      rowUpdateMode: "full" as const,
      sync: (params: {
        begin: (options?: { snapshot?: boolean }) => void;
        write: (message: never) => void;
        commit: () => unknown;
        markReady: () => void;
        fail: (error: unknown) => void;
        reportError: (error: unknown) => void;
        reportHealthy: () => void;
        metadata?: {
          collection: { get: (key: string) => unknown; set: (key: string, value: unknown) => void };
        };
      }) => {
        const { begin, write, commit, markReady, fail, reportError, reportHealthy, metadata } =
          params;
        let ready = false;
        let disposed = false;
        let running: Promise<void> | undefined;
        let lastPull = 0;

        const shapeAll = async (rows: Record<string, unknown>[]) => {
          const columns = client.collection(columnsCollection(tableId));
          await columns.preload();
          const shaped = columns.toArray.filter((column) => column.format !== "binary");
          return rows.map((row) => shapeSyncRow(row, shaped));
        };

        const apply = async () => {
          const stored = metadata?.collection.get(CURSOR_KEY) as number | undefined;
          const delta = stored !== undefined && Date.now() - stored < MAX_CURSOR_AGE_MS;
          try {
            const result = await fetchRecords(tableId, delta ? stored : undefined);
            const live = result.rows.filter((row) => row.deleted_at == null);
            const shaped = await shapeAll(live);
            if (disposed) return;
            begin({ snapshot: !delta });
            for (const row of shaped) write({ type: "update", value: row } as never);
            for (const row of result.rows)
              if (row.deleted_at != null) write({ type: "delete", key: row.id } as never);
            metadata?.collection.set(CURSOR_KEY, result.syncedAt);
            commit();
            lastPull = Date.now();
            if (ready) reportHealthy();
            else {
              ready = true;
              markReady();
            }
          } catch (error) {
            if (disposed) return;
            if (ready) reportError(error);
            else if (stored !== undefined) {
              ready = true;
              markReady();
            } else fail(error);
            throw error;
          }
        };

        const pull = () => {
          running ??= apply().finally(() => {
            running = undefined;
          });
          return running;
        };
        controller.pull = pull;

        const refresh = () => {
          if (navigator.onLine && Date.now() - lastPull > REFRESH_AFTER_MS)
            void pull().catch(() => {});
        };
        const onVisible = () => {
          if (document.visibilityState === "visible") refresh();
        };
        const onOnline = () => void pull().catch(() => {});
        window.addEventListener("online", onOnline);
        document.addEventListener("visibilitychange", onVisible);

        void pull().catch(() => {});

        return () => {
          disposed = true;
          window.removeEventListener("online", onOnline);
          document.removeEventListener("visibilitychange", onVisible);
        };
      },
    };

    const options = {
      id,
      getKey: (row: RecordRow) => row.id,
      sync,
      utils,
    };
    if (!persistence) return options;
    return persistedCollectionOptions({
      ...options,
      persistence,
      schemaVersion: 1,
      initialRender: { strategy: "network-first", networkTimeoutMs: 0 },
    } as never) as unknown as typeof options;
  });
};

const recordCollections = new Map<number, ReturnType<typeof createRecordsCollection>>();

export function recordsCollection(tableId: number) {
  let descriptor = recordCollections.get(tableId);
  if (!descriptor) {
    descriptor = createRecordsCollection(tableId);
    recordCollections.set(tableId, descriptor);
  }
  return descriptor;
}

export type PendingRecords = {
  id: string;
  tableId: number;
  rows: Record<string, unknown>[];
};

export const PENDING_RECORDS = "pendingRecords";

export const pendingRecordsCollection = collectionOptions(PENDING_RECORDS, () =>
  localOnlyCollectionOptions({
    id: PENDING_RECORDS,
    getKey: (row: PendingRecords) => row.id,
  }),
);

export const valuesOf = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).filter(([key]) => !SYSTEM_FIELDS.includes(key)));

export const RECORDS_MUTATION = "records";

const PERMANENT_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

const messageOf = (error: FetchError) => {
  const data = error.data as { message?: string; error?: string } | string | undefined;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data === "object" && data) return data.message ?? data.error ?? error.message;
  return error.message;
};

const reject = (error: unknown): never => {
  if (error instanceof FetchError && error.status && PERMANENT_STATUSES.has(error.status)) {
    const message = messageOf(error);
    toastManager.add({ type: "error", title: "A change couldn't be saved", description: message });
    throw new NonRetriableError(message);
  }
  throw error;
};

type PendingMutation = {
  type: string;
  key: unknown;
  modified: Record<string, unknown>;
  changes: Record<string, unknown>;
  collection: { id: string; utils: Record<string, unknown> };
};

export const createRecordsMutationFn =
  (client: DbClient) =>
  async ({ transaction }: { transaction: { mutations: PendingMutation[] } }) => {
    const touched = new Map<number, PendingMutation["collection"]>();
    const mutations = transaction.mutations;

    for (let index = 0; index < mutations.length;) {
      const first = mutations[index];
      if (first.collection.id === PENDING_RECORDS) {
        const pending = first.modified as unknown as PendingRecords;
        index++;
        await fetch("/api/workspaces/:workspace/tables/:table/records", {
          method: "POST",
          params: { workspace: DEFAULT_WORKSPACE, table: String(pending.tableId) },
          body: { rows: pending.rows.map((values) => ({ values })) },
        }).catch(reject);
        const records = client.collection(recordsCollection(pending.tableId));
        await records.preload();
        await (records.utils as unknown as RecordsUtils).pull();
        continue;
      }
      const tableId = tableIdOfCollection(first.collection.id);
      if (tableId === undefined) throw new NonRetriableError("Unknown collection");
      touched.set(tableId, first.collection);
      const params = { workspace: DEFAULT_WORKSPACE, table: String(tableId) };

      let end = index;
      while (
        end < mutations.length &&
        mutations[end].type === first.type &&
        mutations[end].collection.id === first.collection.id
      )
        end++;
      const group = mutations.slice(index, end);
      index = end;

      if (first.type === "delete") {
        await fetch("/api/workspaces/:workspace/tables/:table/records", {
          method: "DELETE",
          params,
          body: { ids: group.map((mutation) => Number(mutation.key)) },
        }).catch(reject);
      } else {
        for (const mutation of group) {
          const values = valuesOf(mutation.changes);
          if (Object.keys(values).length === 0) continue;
          await fetch("/api/workspaces/:workspace/tables/:table/records/:record", {
            method: "PATCH",
            params: { ...params, record: String(mutation.key) },
            body: { values },
          }).catch(reject);
        }
      }
    }

    for (const collection of touched.values()) await (collection.utils as RecordsUtils).pull();
  };

export type RecordsCollection = {
  id: string;
  insert: (rows: RecordRow | RecordRow[]) => unknown;
  update: (key: number, change: (draft: RecordRow) => void) => unknown;
  delete: (keys: number | number[]) => unknown;
};

export const recordActions = (executor: OfflineExecutor) => ({
  insert: executor.createOfflineAction<{
    pending: {
      insert: (row: PendingRecords) => unknown;
    };
    row: PendingRecords;
  }>({
    mutationFnName: RECORDS_MUTATION,
    onMutate: ({ pending, row }) => {
      pending.insert(row);
    },
  }),
  update: executor.createOfflineAction<{
    collection: RecordsCollection;
    id: number;
    values: Record<string, unknown>;
  }>({
    mutationFnName: RECORDS_MUTATION,
    onMutate: ({ collection, id, values }) => {
      collection.update(id, (draft) => {
        Object.assign(draft, values);
      });
    },
  }),
  remove: executor.createOfflineAction<{ collection: RecordsCollection; ids: number[] }>({
    mutationFnName: RECORDS_MUTATION,
    onMutate: ({ collection, ids }) => {
      collection.delete(ids);
    },
  }),
});

const actionCache = new WeakMap<OfflineExecutor, ReturnType<typeof recordActions>>();

export function recordActionsFor(executor: OfflineExecutor) {
  let actions = actionCache.get(executor);
  if (!actions) {
    actions = recordActions(executor);
    actionCache.set(executor, actions);
  }
  return actions;
}
