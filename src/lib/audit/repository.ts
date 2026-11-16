import { auditTable } from "@db/schema";
import { and, asc, db, desc, eq, gt, gte, lt, lte, or } from "void/db";

import type { AuditAction, AuditChange } from "./actions";
import { type AuditCursor, encodeAuditCursor } from "./cursor";

export type NewAuditEntry = {
  tableId: number;
  tableLabel: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  recordIds: number[];
  count: number;
  changes: AuditChange[];
};

export async function insertAuditEntry(entry: NewAuditEntry) {
  await db.insert(auditTable).values(entry);
}

export type AuditPageQuery = {
  pageSize: number;
  table: number | null;
  action: AuditAction | null;
  dir: "next" | "prev";
  cursor: AuditCursor | null;
};

export async function listAuditEntries(query: AuditPageQuery) {
  const backwards = query.dir === "prev";
  const seek = (() => {
    if (!query.cursor) return undefined;
    const at = new Date(query.cursor.createdAt);
    return backwards
      ? and(
          gte(auditTable.createdAt, at),
          or(gt(auditTable.createdAt, at), gt(auditTable.id, query.cursor.id)),
        )
      : and(
          lte(auditTable.createdAt, at),
          or(lt(auditTable.createdAt, at), lt(auditTable.id, query.cursor.id)),
        );
  })();

  const fetched = await db
    .select()
    .from(auditTable)
    .where(
      and(
        query.table === null ? undefined : eq(auditTable.tableId, query.table),
        query.action === null ? undefined : eq(auditTable.action, query.action),
        seek,
      ),
    )
    .orderBy(
      backwards ? asc(auditTable.createdAt) : desc(auditTable.createdAt),
      backwards ? asc(auditTable.id) : desc(auditTable.id),
    )
    .limit(query.pageSize + 1);

  const hasMore = fetched.length > query.pageSize;
  const rows = fetched.slice(0, query.pageSize);
  if (backwards) rows.reverse();
  const first = rows.at(0);
  const last = rows.at(-1);

  return {
    rows,
    prevCursor:
      first && (backwards ? hasMore : query.cursor !== null) ? encodeAuditCursor(first) : null,
    nextCursor: last && (backwards ? true : hasMore) ? encodeAuditCursor(last) : null,
  };
}

export async function purgeExpiredAudit(cutoff: Date) {
  const deleted = await db
    .delete(auditTable)
    .where(lt(auditTable.createdAt, cutoff))
    .returning({ id: auditTable.id });
  return deleted.length;
}
