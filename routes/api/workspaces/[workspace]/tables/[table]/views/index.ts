import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { visibleResources } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";
import { resolveViewsQuery, viewsSearchSchema } from "@/lib/views/query";
import {
  createView,
  findViews,
  listViews,
  listViewsPage,
  softDeleteViews,
} from "@/lib/views/repository";
import { checkViewDefinition, viewInputSchema, viewsDeleteSchema } from "@/lib/views/validation";
import { ViewWhereError } from "@/lib/views/where";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: viewsSearchSchema })(async (
  c,
  { params, query },
) => {
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const visible = await visibleResources(
    requireAuth(c),
    "read",
    table.id,
    await listViews(table.id),
  );
  return listViewsPage(
    table.id,
    resolveViewsQuery(query),
    visible.map((view) => view.id),
  );
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: viewInputSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");

    const columns = await listColumns(table.id);
    const problem = checkViewDefinition(columns, body);
    if (problem) throw httpError(400, problem);

    try {
      return await createView(c.get("workspaceId"), table, columns, body, requireAuth(c).id);
    } catch (error) {
      if (error instanceof ViewWhereError) throw httpError(400, error.message);
      conflictOrBadRequest(error, "A view with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: viewsDeleteSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");

    const ids = [...new Set(body.ids)];
    if ((await findViews(table.id, ids)).length !== ids.length)
      throw httpError(404, "View not found.");

    await softDeleteViews(ids, requireAuth(c).id);
    return { ok: true };
  }),
);
