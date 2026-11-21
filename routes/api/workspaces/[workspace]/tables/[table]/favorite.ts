import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAccess } from "@/lib/access/require-access";
import { httpError, NOT_FOUND } from "@/lib/http";
import { addFavorite, findTable, removeFavorite } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const PUT = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await requireAccess(c, params.table, "read");
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  return addFavorite(user.id, table.id);
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await removeFavorite(user.id, params.table);
  return { tableId: params.table };
});
