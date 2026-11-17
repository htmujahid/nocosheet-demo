import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError, NOT_FOUND } from "@/lib/http";
import { findTable } from "@/lib/tables/repository";
import { listDeletedViews } from "@/lib/views/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  return { rows: await listDeletedViews(table.id) };
});
