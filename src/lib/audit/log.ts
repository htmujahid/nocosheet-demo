import { AUDIT_RECORD_IDS_LIMIT } from "./actions";
import { insertAuditEntry, type NewAuditEntry } from "./repository";

type Actor = { id: string; name: string };
type AuditedTable = { id: number; name: string; isAudit: boolean };
type Entry = Pick<NewAuditEntry, "action"> &
  Partial<Pick<NewAuditEntry, "recordIds" | "count" | "changes">>;

export async function logRecordAudit(actor: Actor, table: AuditedTable, entry: Entry) {
  if (!table.isAudit) return;
  const recordIds = entry.recordIds ?? [];
  try {
    await insertAuditEntry({
      tableId: table.id,
      tableLabel: table.name,
      actorId: actor.id,
      actorName: actor.name,
      action: entry.action,
      recordIds: recordIds.slice(0, AUDIT_RECORD_IDS_LIMIT),
      count: entry.count ?? recordIds.length,
      changes: entry.changes ?? [],
    });
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}
