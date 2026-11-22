import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import {
  findDeletedColumn,
  findColumn,
  findLiveColumnNamed,
  findTable,
  restoreColumn,
} from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive(),
});

export const POST = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const column = await findDeletedColumn(table.id, params.column);
  if (!column) throw httpError(404, "This column isn't in the trash.");

  if (await findLiveColumnNamed(table.id, column.name))
    throw httpError(
      409,
      `A column named "${column.name}" already exists. Rename it first, then restore this one.`,
    );

  try {
    await restoreColumn(c.get("workspaceId"), table, column);
  } catch (error) {
    conflictOrBadRequest(
      error,
      `"${column.name}" can't be restored: its values are no longer unique.`,
    );
  }
  return {
    column: await findColumn(table.id, column.id),
    table: (await findTable(table.id)) ?? table,
  };
});
