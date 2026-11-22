import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { loadAccess } from "@/lib/access/load-access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import {
  createTable,
  findLinkingColumns,
  findTables,
  listTables,
  softDeleteTables,
} from "@/lib/tables/repository";
import { tableInputSchema, tablesDeleteSchema } from "@/lib/tables/validation";

export const GET = defineHandler(async (c) => {
  const user = requireAuth(c);
  const [access, rows] = await Promise.all([loadAccess(user), listTables()]);
  if (access.admin) return rows;
  return rows.filter((row) =>
    (["read", "create", "update"] as const).some(
      (action) => access.scope(row.id, action) !== "none",
    ),
  );
});

export const POST = defineHandler.withValidator({ body: tableInputSchema })(async (c, { body }) => {
  requireAdmin(c);
  const user = requireAuth(c);

  try {
    return await createTable(c.get("workspaceId"), body, user.id);
  } catch (error) {
    conflictOrBadRequest(error, "A table with this name already exists.");
  }
});

export const DELETE = defineHandler.withValidator({ body: tablesDeleteSchema })(async (
  c,
  { body },
) => {
  requireAdmin(c);
  const ids = [...new Set(body.ids)];

  const tables = await findTables(ids);
  if (tables.length !== ids.length) throw httpError(404, NOT_FOUND);

  const [link] = await findLinkingColumns(ids, { liveOnly: true });
  if (link)
    throw httpError(
      409,
      `"${link.table}" has a column "${link.column}" that links to a table you are deleting. Delete "${link.table}" first.`,
    );

  try {
    await softDeleteTables(ids, requireAuth(c).id);
  } catch (error) {
    throw httpError(
      409,
      error instanceof Error ? error.message : "The tables could not be deleted.",
    );
  }
  return { ids };
});
