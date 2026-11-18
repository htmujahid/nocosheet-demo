import { defineHandler } from "void";
import { z } from "zod";

import { httpError, NOT_FOUND } from "@/lib/http";
import { findExportRecords, viewScope } from "@/lib/records/repository";
import { requireAccess } from "@/lib/access/require-access";
import { findTable, listColumns } from "@/lib/tables/repository";
import { findView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  await requireAccess(c, "export", params.table, params.view);
  const { ownerId } = await requireAccess(c, "read", params.table, params.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const view = await findView(table.id, params.view);
  if (!view) throw httpError(404, NOT_FOUND);

  const all = await listColumns(table.id);
  const columns = all.filter((column) => view.selectColumns.includes(column.columnName));
  const workspace = c.get("workspaceId");
  return findExportRecords(
    workspace,
    table,
    columns,
    ownerId,
    viewScope(all, view.whereExpression),
  );
});
