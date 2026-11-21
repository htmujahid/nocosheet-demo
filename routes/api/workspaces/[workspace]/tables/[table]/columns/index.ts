import { defineHandler } from "void";
import { z } from "zod";

import { requireAccess } from "@/lib/access/require-access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { DdlError, type RelationTarget } from "@/lib/tables/ddl";
import { createColumn, findRelationTarget, findTable, listColumns } from "@/lib/tables/repository";
import { columnInputSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  await requireAccess(c, params.table, ["read", "create", "update"]);
  if (!(await findTable(params.table))) throw httpError(404, NOT_FOUND);
  return listColumns(params.table);
});

export const POST = defineHandler.withValidator({ params, body: columnInputSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const workspace = c.get("workspaceId");
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const targets = new Map<number, RelationTarget>();
  if (body.format === "relation") {
    const target = await findRelationTarget(workspace, Number(body.options.tableId));
    if (target) targets.set(target.id, target);
  }

  try {
    const column = await createColumn(workspace, table, body, targets);
    return { column, table: (await findTable(table.id)) ?? table };
  } catch (error) {
    if (error instanceof DdlError) throw httpError(400, error.message);
    conflictOrBadRequest(error, "A column with this name already exists.");
  }
});
