import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { visibleResources } from "@/lib/access/guard";
import { findTable, listColumns } from "@/lib/tables/repository";
import { viewsLimitSchema } from "@/lib/views/query";
import {
  createView,
  findViews,
  listViews,
  deleteViews,
} from "@/lib/views/repository";
import { checkViewDefinition, viewInputSchema, viewsDeleteSchema } from "@/lib/views/validation";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: viewsLimitSchema })(async (
  c,
  { params, query },
) => {
  if (!(await findTable(params.table))) return [];
  const views = await visibleResources(
    requireAuth(c),
    "read",
    params.table,
    await listViews(params.table),
  );
  return query.limit ? views.slice(0, query.limit) : views;
});

export const POST = defineHandler.withValidator({ params, body: viewInputSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const columns = await listColumns(table.id);
  const problem = checkViewDefinition(columns, body);
  if (problem) throw httpError(400, problem);

  try {
    return await createView(table, columns, body, requireAuth(c).id);
  } catch (error) {
    conflictOrBadRequest(error, "A view with this name already exists.");
  }
});

export const DELETE = defineHandler.withValidator({ params, body: viewsDeleteSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const ids = [...new Set(body.ids)];
  if ((await findViews(table.id, ids)).length !== ids.length) throw httpError(404, NOT_FOUND);

  await deleteViews(ids);
  return { ok: true };
});
