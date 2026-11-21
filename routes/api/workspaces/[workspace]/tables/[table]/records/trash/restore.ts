import { defineHandler } from "void";
import { z } from "zod";

import { auditRestored } from "@/lib/audit/records";
import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError, NOT_FOUND, writeFailure } from "@/lib/http";
import { checkLinks } from "@/lib/records/links";
import {
  findRecordsForResponse,
  findRecordTable,
  findTrashedRecord,
  restoreRecordRow,
} from "@/lib/records/repository";
import { findMissingRequired, parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
});

const body = recordPatchSchema.partial().extend({ id: z.number().int().positive() });

export const POST = defineHandler.withValidator({ params, body })(async (c, { params, body }) => {
  const user = requireAdmin(c);
  const workspace = c.get("workspaceId");
  const table = await findRecordTable(c.get("workspaceId"), params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const columns = await listColumns(table.id);
  const row = await findTrashedRecord(workspace, table, columns, body.id);
  if (!row) throw httpError(404, "This record is no longer in the trash.");

  const edits = parseRecordValues(columns, body.values ?? {});
  if (!edits.ok) throw httpError(400, edits.message, edits.field);

  const current = columns
    .filter((column) => column.generatedExpression === null && column.columnName in row)
    .map((column) => ({ column, value: row[column.columnName] as string | number | null }));
  const edited = new Set(edits.values.map((edit) => edit.column.id));
  const parsed = [...current.filter((item) => !edited.has(item.column.id)), ...edits.values];

  const broken = await checkLinks(workspace, parsed);
  if (broken) throw httpError(400, broken.message, broken.field);
  const missing = findMissingRequired(columns, parsed);
  if (missing) throw httpError(400, `${missing.name}: This field is required`, missing.columnName);

  let restored: Awaited<ReturnType<typeof restoreRecordRow>>;
  try {
    restored = await restoreRecordRow(workspace, table, body.id, edits.values, user.id);
  } catch (error) {
    writeFailure(error, columns);
  }
  if (!restored) throw httpError(404, "This record is no longer in the trash.");
  await auditRestored(user, table, columns, parsed, body.id);
  return { rows: await findRecordsForResponse(workspace, table, [body.id]) };
});
