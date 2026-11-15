import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { findExportRecords } from "@/lib/records/repository";
import { authorizeExport } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";
import { physicalViewName } from "@/lib/views/naming";
import { findView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const { ownerId } = await authorizeExport(requireAuth(c), params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const view = await findView(table.id, params.view);
  if (!view) throw httpError(404, "View not found.");

  const columns = (await listColumns(table.id)).filter((column) =>
    view.selectColumns.includes(column.columnName),
  );
  const workspace = c.get("workspaceId");
  return findExportRecords(
    workspace,
    table,
    columns,
    ownerId,
    physicalViewName(workspace, view.viewName),
  );
});
