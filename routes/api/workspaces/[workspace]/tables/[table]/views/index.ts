import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
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
  const visible = (await findTable(params.table))
    ? await visibleResources(requireAuth(c), "read", params.table, await listViews(params.table))
    : [];
  return listViewsPage(
    params.table,
    resolveViewsQuery(query),
    visible.map((view) => view.id),
  );
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: viewInputSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, NOT_FOUND);

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
    if (!table) throw httpError(404, NOT_FOUND);

    const ids = [...new Set(body.ids)];
    if ((await findViews(table.id, ids)).length !== ids.length)
      throw httpError(404, NOT_FOUND);

    await softDeleteViews(ids, requireAuth(c).id);
    return { ok: true };
  }),
);
