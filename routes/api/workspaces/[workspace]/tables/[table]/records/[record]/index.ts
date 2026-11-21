import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAccess } from "@/lib/access/require-access";
import { auditUpdated, beginAudit } from "@/lib/audit/records";
import { httpError, NOT_FOUND, writeFailure } from "@/lib/http";
import { checkLinks } from "@/lib/records/links";
import { findRecordsForResponse, findRecordTable, updateRecordRow } from "@/lib/records/repository";
import { parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  record: z.coerce.number().int().positive(),
});

export const PATCH = defineHandler.withValidator({
  params,
  body: recordPatchSchema,
})(async (c, { params, body }) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await requireAccess(c, params.table, "update");
  const table = await findRecordTable(c.get("workspaceId"), params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const columns = await listColumns(table.id);

  const parsed = parseRecordValues(columns, body.values);
  if (!parsed.ok) throw httpError(400, parsed.message, parsed.field);
  if (parsed.values.length === 0) throw httpError(400, "Nothing to update.");

  const broken = await checkLinks(workspace, parsed.values);
  if (broken) throw httpError(400, broken.message, broken.field);

  const audit = await beginAudit(workspace, table, params.record);
  let updated: Awaited<ReturnType<typeof updateRecordRow>>;
  try {
    updated = await updateRecordRow(
      workspace,
      table,
      params.record,
      parsed.values,
      user.id,
      ownerId,
    );
  } catch (error) {
    writeFailure(error, columns);
  }
  if (!updated) throw httpError(404, NOT_FOUND);
  await auditUpdated(
    user,
    table,
    audit,
    parsed.values.map((item) => item.column),
    updated,
  );
  return { rows: await findRecordsForResponse(workspace, table, [params.record]) };
});
