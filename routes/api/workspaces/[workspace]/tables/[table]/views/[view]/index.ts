import { defineHandler } from "void";
import { z } from "zod";

import { requireAccess } from "@/lib/access/require-access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { findTable } from "@/lib/tables/repository";
import { deleteViews, findView, updateView } from "@/lib/views/repository";
import { viewPatchSchema } from "@/lib/views/validation";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  await requireAccess(c, params.table, "read");
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const view = await findView(table.id, params.view);
  if (!view) throw httpError(404, NOT_FOUND);

  return view;
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
  await deleteViews([params.view]);
  return { ids: [params.view] };
});
