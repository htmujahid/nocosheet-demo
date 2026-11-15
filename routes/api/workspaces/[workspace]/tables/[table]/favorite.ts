import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError, NOT_FOUND } from "@/lib/http";
import { requireAccess } from "@/lib/roles/require-access";
import { addFavorite, findTable, removeFavorite } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const PUT = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await requireAccess(c, "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  await addFavorite(user.id, table.id);
  return { ok: true };
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await removeFavorite(user.id, params.table);
  return { ok: true };
});
