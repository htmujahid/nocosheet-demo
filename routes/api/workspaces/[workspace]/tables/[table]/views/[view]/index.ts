import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { requireAccess } from "@/lib/roles/require-access";
import { findTable, listColumns } from "@/lib/tables/repository";
import { findView, softDeleteView, updateView } from "@/lib/views/repository";
import { viewPatchSchema } from "@/lib/views/validation";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  await requireAccess(c, "read", params.table, params.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const view = await findView(table.id, params.view);
  if (!view) throw httpError(404, NOT_FOUND);

  const columns = (await listColumns(table.id)).filter((column) =>
    view.selectColumns.includes(column.columnName),
  );
  return {
    ...view,
    table: { id: table.id, name: table.name, titleColumnId: table.titleColumnId },
    columns,
  };
});

export const PATCH = defineHandler.withValidator({ params, body: viewPatchSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const view = await findView(table.id, params.view);
  if (!view) throw httpError(404, NOT_FOUND);

  try {
    return await updateView(params.view, body);
  } catch (error) {
    conflictOrBadRequest(error, "A view with this name already exists.");
  }
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  if (!(await findView(params.table, params.view))) throw httpError(404, NOT_FOUND);
  await softDeleteView(params.view, requireAuth(c).id);
  return { ok: true };
});
