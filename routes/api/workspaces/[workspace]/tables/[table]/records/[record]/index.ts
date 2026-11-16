import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { auditDeleted, auditUpdated, beginAudit } from "@/lib/audit/records";
import { httpError, NOT_FOUND, writeFailure } from "@/lib/http";
import { deleteRecords } from "@/lib/records/deletion";
import { checkLinks } from "@/lib/records/links";
import {
  countOwnedRecords,
  countRecordsInView,
  findRecord,
  updateRecordRow,
} from "@/lib/records/repository";
import { parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { requireAccess } from "@/lib/access/require-access";
import { findTable, listColumns } from "@/lib/tables/repository";
import { filteredViewSource, physicalViewName } from "@/lib/views/naming";
import { viewScopeSchema } from "@/lib/views/query";
import { findView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  record: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params, query: viewScopeSchema })(async (
  c,
  { params, query },
) => {
  const { ownerId } = await requireAccess(c, ["read", "update"], params.table, query.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const all = await listColumns(table.id);
  const view = query.view ? await findView(table.id, query.view) : undefined;
  const columns = view
    ? all.filter((column) => view.selectColumns.includes(column.columnName))
    : all;
  const record = await findRecord(
    c.get("workspaceId"),
    table,
    columns,
    params.record,
    ownerId,
    view && physicalViewName(c.get("workspaceId"), view.viewName),
  );
  if (!record) throw httpError(404, NOT_FOUND);
  return record;
});

export const PATCH = defineHandler.withValidator({
  params,
  query: viewScopeSchema,
  body: recordPatchSchema,
})(async (c, { params, query, body }) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await requireAccess(c, "update", params.table, query.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const columns = await listColumns(table.id);
  const view = query.view ? await findView(table.id, query.view) : undefined;
  const stray = view && Object.keys(body.values).find((key) => !view.selectColumns.includes(key));
  if (stray) throw httpError(400, `"${stray}" isn't part of this view.`);

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
      filteredViewSource(workspace, view),
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
  return { ok: true };
});

export const DELETE = defineHandler.withValidator({ params, query: viewScopeSchema })(async (
  c,
  { params, query },
) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await requireAccess(c, "delete", params.table, query.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const view = query.view ? await findView(table.id, query.view) : undefined;
  const source = filteredViewSource(workspace, view);
  if (source && (await countRecordsInView(source, [params.record])) !== 1)
    throw httpError(404, NOT_FOUND);

  if (ownerId && (await countOwnedRecords(workspace, table, [params.record], ownerId)) !== 1)
    throw httpError(403, "You can only delete records you created.");

  const result = await deleteRecords(workspace, table, [params.record], user.id);
  if (!result.ok)
    throw httpError(
      result.reason === "not_found" ? 404 : result.reason === "linked" ? 409 : 400,
      result.message,
    );
  await auditDeleted(user, table, [params.record]);
  return { trash: result.trash };
});
