import { defineHandler } from "void";
import { z } from "zod";

import { httpError, NOT_FOUND } from "@/lib/http";
import { targetsOfColumns, parseFilters } from "@/lib/records/filter-param";
import { recordsApiSchema, resolveRecordsQuery, withFilters } from "@/lib/records/query";
import { findRecords, viewScope } from "@/lib/records/repository";
import { sortKeyOf } from "@/lib/records/sort-param";
import { checkRecordsQuery } from "@/lib/records/validation";
import { requireAccess } from "@/lib/access/require-access";
import { findTable, listColumns } from "@/lib/tables/repository";
import { findView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params, query: recordsApiSchema })(async (
  c,
  { params, query },
) => {
  const { ownerId } = await requireAccess(c, "read", params.table, params.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const row = await findView(table.id, params.view);
  if (!row) throw httpError(404, NOT_FOUND);

  const all = await listColumns(table.id);
  const shown = all.filter((column) => row.selectColumns.includes(column.columnName));
  const parsed = parseFilters(resolveRecordsQuery(query).filter, targetsOfColumns(shown));
  if (parsed.errors.length) throw httpError(400, parsed.errors[0]);
  const requested = resolveRecordsQuery(query);
  const sort = sortKeyOf(shown, requested.sort);
  if (sort === undefined) throw httpError(400, `"${requested.sort}" can't be sorted.`);
  const resolved = { ...withFilters(requested, parsed.filters), sort };

  const problem = checkRecordsQuery(shown, resolved);
  if (problem) throw httpError(400, problem);

  try {
    const workspace = c.get("workspaceId");
    return await findRecords(
      workspace,
      table,
      shown,
      resolved,
      ownerId,
      viewScope(all, row.whereExpression),
    );
  } catch (error) {
    throw httpError(
      400,
      error instanceof Error ? error.message : "The records could not be loaded.",
    );
  }
});
