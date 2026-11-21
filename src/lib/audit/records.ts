import { findRecord } from "../records/repository";
import { shapeRecord } from "../records/shape";
import type { ParsedValue } from "../records/values";
import type { Column, Table } from "../tables/repository";
import { listColumns } from "../tables/repository";
import { diffRecord, snapshotRecord } from "./changes";
import { logRecordAudit } from "./log";

type Actor = { id: string; name: string };

export type AuditSnapshot = { columns: Column[]; record: Record<string, unknown> | undefined };

export async function beginAudit(
  workspace: string,
  table: Table,
  recordId: number,
): Promise<AuditSnapshot | undefined> {
  if (!table.isAudit) return undefined;
  const columns = await listColumns(table.id);
  const row = await findRecord(workspace, table, columns, recordId);
  return { columns, record: row && shapeRecord(row, columns) };
}

export async function auditCreated(
  actor: Actor,
  table: Table,
  columns: Column[],
  written: Column[],
  created: Record<string, unknown> & { id: number },
) {
  if (!table.isAudit) return;
  await logRecordAudit(actor, table, {
    action: "create",
    recordIds: [created.id],
    changes: snapshotRecord(written, shapeRecord(created, columns)),
  });
}

export async function auditUpdated(
  actor: Actor,
  table: Table,
  before: AuditSnapshot | undefined,
  written: Column[],
  updated: Record<string, unknown>,
) {
  if (!table.isAudit || !before?.record) return;
  const changes = diffRecord(written, before.record, shapeRecord(updated, before.columns));
  if (changes.length === 0) return;
  await logRecordAudit(actor, table, {
    action: "update",
    recordIds: [Number(updated.id)],
    changes,
  });
}

export async function auditDeleted(actor: Actor, table: Table, recordIds: number[]) {
  if (!table.isAudit) return;
  await logRecordAudit(actor, table, { action: "delete", recordIds });
}

export async function auditRestored(
  actor: Actor,
  table: Table,
  columns: Column[],
  restored: ParsedValue<Column>[],
  recordId: number,
) {
  if (!table.isAudit) return;
  const row = Object.fromEntries(restored.map(({ column, value }) => [column.columnName, value]));
  await logRecordAudit(actor, table, {
    action: "restore",
    recordIds: [recordId],
    changes: snapshotRecord(
      restored.map((item) => item.column),
      shapeRecord(row, columns),
    ),
  });
}
