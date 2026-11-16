import { defineHandler } from "void";
import { z } from "zod";

import { httpError, NOT_FOUND } from "@/lib/http";
import { findRecordOptions } from "@/lib/records/repository";
import { requireAccess } from "@/lib/access/require-access";
import { findTable } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });
const query = z.object({ q: z.string().trim().max(100).default("") });

export const GET = defineHandler.withValidator({ params, query })(async (c, { params, query }) => {
  const { ownerId } = await requireAccess(c, "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  return findRecordOptions(c.get("workspaceId"), table, query.q, ownerId);
});
