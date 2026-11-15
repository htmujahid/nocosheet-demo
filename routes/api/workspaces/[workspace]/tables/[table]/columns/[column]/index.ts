import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { findFormsUsingColumn } from "@/lib/forms/repository";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { SEARCHABLE_FORMATS } from "@/lib/tables/formats";
import {
  findColumn,
  findColumnsUsing,
  findTable,
  softDeleteColumn,
  updateColumn,
} from "@/lib/tables/repository";
import { columnPatchSchema } from "@/lib/tables/validation";
import { findViewsUsingColumn } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive(),
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: columnPatchSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, NOT_FOUND);
    const column = await findColumn(table.id, params.column);
    if (!column) throw httpError(404, "Column not found.");

    if (body.isSearchable && !SEARCHABLE_FORMATS.includes(column.format as never))
      throw httpError(400, "Only text columns can be searchable.");

    try {
      return await updateColumn(c.get("workspaceId"), table, column, body);
    } catch (error) {
      conflictOrBadRequest(error, "A column with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, NOT_FOUND);
    const column = await findColumn(table.id, params.column);
    if (!column) throw httpError(404, "Column not found.");

    const [views, forms] = await Promise.all([
      findViewsUsingColumn(table.id, column.columnName),
      findFormsUsingColumn(table.id, column.columnName),
    ]);
    const users = [
      ...views.map((view) => `the ${view.deletedAt ? "deleted " : ""}view "${view.name}"`),
      ...forms.map((form) => `the ${form.deletedAt ? "deleted " : ""}form "${form.name}"`),
    ];
    if (users.length > 0)
      throw httpError(
        409,
        `"${column.name}" is used by ${users.join(", ")}, so it can't be deleted.`,
      );

    const dependents = await findColumnsUsing(table.id, column.columnName);
    if (dependents.length > 0)
      throw httpError(
        409,
        `"${column.name}" is used by the computed value or check of ${dependents.map((item) => `"${item.name}"`).join(", ")}, so it can't be deleted.`,
      );

    await softDeleteColumn(c.get("workspaceId"), table, column, requireAuth(c).id);
    return { ok: true };
  }),
);
