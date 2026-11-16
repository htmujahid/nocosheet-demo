import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { auditCreated, auditDeleted } from "@/lib/audit/records";
import { httpError, NOT_FOUND, writeFailure } from "@/lib/http";
import { deleteRecords } from "@/lib/records/deletion";
import { targetsOfColumns, parseFilters } from "@/lib/records/filter-param";
import { checkLinks } from "@/lib/records/links";
import {
  recordsApiSchema,
  recordsDeleteSchema,
  resolveRecordsQuery,
  withFilters,
} from "@/lib/records/query";
import { countOwnedRecords, createRecordRow, findRecords } from "@/lib/records/repository";
import { sortKeyOf } from "@/lib/records/sort-param";
import { checkRecordsQuery } from "@/lib/records/validation";
import { findMissingRequired, parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { requireAccess } from "@/lib/roles/require-access";
import { findTable, listColumns } from "@/lib/tables/repository";
import { viewScopeSchema } from "@/lib/views/query";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: recordsApiSchema })(async (
  c,
  { params, query },
) => {
  const { ownerId } = await requireAccess(c, "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const columns = await listColumns(table.id);
  const parsed = parseFilters(resolveRecordsQuery(query).filter, targetsOfColumns(columns));
  if (parsed.errors.length) throw httpError(400, parsed.errors[0]);
  const requested = resolveRecordsQuery(query);
  const sort = sortKeyOf(columns, requested.sort);
  if (sort === undefined) throw httpError(400, `"${requested.sort}" can't be sorted.`);
  const resolved = { ...withFilters(requested, parsed.filters), sort };

  const problem = checkRecordsQuery(columns, resolved);
  if (problem) throw httpError(400, problem);

  try {
    return await findRecords(c.get("workspaceId"), table, columns, resolved, ownerId);
  } catch (error) {
    throw httpError(
      400,
      error instanceof Error ? error.message : "The records could not be loaded.",
    );
  }
});

export const POST = defineHandler.withValidator({
  params,
  query: viewScopeSchema,
  body: recordPatchSchema,
})(async (c, { params, query, body }) => {
  const workspace = c.get("workspaceId");
  await requireAccess(c, "create", params.table, query.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const columns = await listColumns(table.id);

  const parsed = parseRecordValues(columns, body.values);
  if (!parsed.ok) throw httpError(400, parsed.message, parsed.field);

  const broken = await checkLinks(workspace, parsed.values);
  if (broken) throw httpError(400, broken.message, broken.field);

  const missing = findMissingRequired(columns, parsed.values);
  if (missing) throw httpError(400, `${missing.name}: This field is required`, missing.columnName);

  const user = requireAuth(c);
  try {
    const created = await createRecordRow(workspace, table, parsed.values, user.id);
    if (!created) throw httpError(400, "The record could not be created.");
    await auditCreated(
      user,
      table,
      columns,
      parsed.values.map((item) => item.column),
      created,
    );
    return { id: created.id };
  } catch (error) {
    writeFailure(error, columns);
  }
});

export const DELETE = defineHandler.withValidator({
  params,
  query: viewScopeSchema,
  body: recordsDeleteSchema,
})(async (c, { params, query, body }) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await requireAccess(c, "delete", params.table, query.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const ids = [...new Set(body.ids)];
  if (ownerId && (await countOwnedRecords(workspace, table, ids, ownerId)) !== ids.length)
    throw httpError(403, "You can only delete records you created.");

  const result = await deleteRecords(workspace, table, body.ids, user.id);
  if (!result.ok)
    throw httpError(
      result.reason === "not_found" ? 404 : result.reason === "linked" ? 409 : 400,
      result.message,
    );
  await auditDeleted(user, table, ids);
  return { trash: result.trash };
});
