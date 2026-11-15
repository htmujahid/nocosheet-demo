import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError, NOT_FOUND } from "@/lib/http";
import { findExportRecords } from "@/lib/records/repository";
import { authorizeExport } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const { ownerId } = await authorizeExport(requireAuth(c), params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  return findExportRecords(c.get("workspaceId"), table, await listColumns(table.id), ownerId);
});
