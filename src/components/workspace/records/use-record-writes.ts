import { useDbClient } from "@tanstack/react-db";

import {
  type PendingRecords,
  pendingRecordsCollection,
  type RecordsCollection,
  recordActionsFor,
  recordsCollection,
} from "@/data/workspace/records";
import { useOffline } from "@/hooks/use-offline";

export function useRecordWrites(tableId: number) {
  const dbClient = useDbClient();
  const offline = useOffline();
  const collection = dbClient.collection(
    recordsCollection(tableId),
  ) as unknown as RecordsCollection;
  const pending = dbClient.collection(pendingRecordsCollection);

  const insert = (rows: Record<string, unknown>[]) =>
    recordActionsFor(offline.executor).insert({
      pending: pending as unknown as { insert: (row: PendingRecords) => unknown },
      row: { id: crypto.randomUUID(), tableId, rows },
    });

  return {
    create: (values: Record<string, unknown>) => insert([values]),
    createMany: (rows: Record<string, unknown>[]) => insert(rows),
    update: (id: number, values: Record<string, unknown>) =>
      recordActionsFor(offline.executor).update({ collection, id, values }),
    remove: (ids: number[]) => recordActionsFor(offline.executor).remove({ collection, ids }),
  };
}
