import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAccess } from "@/lib/access/require-access";
import { logRecordAudit } from "@/lib/audit/log";
import { auditCreated, auditDeleted } from "@/lib/audit/records";
import { httpError, NOT_FOUND, writeFailure } from "@/lib/http";
import { deleteRecords } from "@/lib/records/deletion";
import { checkLinks } from "@/lib/records/links";
import {
  countOwnedRecords,
  createRecordRows,
  findRecordsForResponse,
  findRecordTable,
  findSyncRows,
  serverClock,
} from "@/lib/records/repository";
import { findMissingRequired, type ParsedValue, parseRecordValues } from "@/lib/records/values";
import { type Column, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

const MAX_BATCH = 100;

const recordId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const createSchema = z.object({
  rows: z
    .array(z.object({ values: z.record(z.string(), z.unknown()) }))
    .min(1)
    .max(MAX_BATCH),
});

const deleteSchema = z.object({ ids: z.array(recordId).min(1).max(500) });

export const GET = defineHandler.withValidator({
  params,
  query: z.object({ since: z.coerce.number().int().nonnegative().optional() }),
})(async (c, { params, query }) => {
  const { ownerId } = await requireAccess(c, params.table, "read");
  const table = await findRecordTable(c.get("workspaceId"), params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const syncedAt = await serverClock();
  const rows = await findSyncRows(c.get("workspaceId"), table, { since: query.since, ownerId });
  return { rows, syncedAt };
});

export const POST = defineHandler.withValidator({
  params,
  body: createSchema,
})(async (c, { params, body }) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  await requireAccess(c, params.table, "create");
  const table = await findRecordTable(c.get("workspaceId"), params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const columns = await listColumns(table.id);

  const records: ParsedValue<Column>[][] = [];
  for (const row of body.rows) {
    const parsed = parseRecordValues(columns, row.values);
    if (!parsed.ok) throw httpError(400, parsed.message, parsed.field);
    const broken = await checkLinks(workspace, parsed.values);
    if (broken) throw httpError(400, broken.message, broken.field);
    const missing = findMissingRequired(columns, parsed.values);
    if (missing)
      throw httpError(400, `${missing.name}: This field is required`, missing.columnName);
    records.push(parsed.values);
  }

  let ids: number[];
  try {
    ids = await createRecordRows(workspace, table, records, user.id);
  } catch (error) {
    writeFailure(error, columns);
  }

  if (ids.length === 1)
    await auditCreated(
      user,
      table,
      columns,
      records[0].map((item) => item.column),
      { id: ids[0] },
    );
  else await logRecordAudit(user, table, { action: "import", recordIds: ids });

  return { rows: await findRecordsForResponse(workspace, table, ids) };
});

export const DELETE = defineHandler.withValidator({
  params,
  body: deleteSchema,
})(async (c, { params, body }) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await requireAccess(c, params.table, "delete");
  const table = await findRecordTable(c.get("workspaceId"), params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const ids = [...new Set(body.ids)];
  if (ownerId && (await countOwnedRecords(workspace, table, ids, ownerId)) !== ids.length)
    throw httpError(403, "You can only delete records you created.");

  const result = await deleteRecords(workspace, table, ids, user.id);
  if (!result.ok) throw httpError(result.reason === "linked" ? 409 : 400, result.message);
  if (result.deleted.length) await auditDeleted(user, table, result.deleted);
  return {
    rows: await findRecordsForResponse(workspace, table, result.deleted, { deleted: true }),
  };
});
