import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError, NOT_FOUND } from "@/lib/http";
import { findTrashedRecord, findTrashLabels, findRecordTable } from "@/lib/records/repository";
import { shapeRecord } from "@/lib/records/shape";
import { listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  record: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  const table = await findRecordTable(c.get("workspaceId"), params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const columns = await listColumns(table.id);
  const row = await findTrashedRecord(c.get("workspaceId"), table, columns, params.record);
  if (!row) throw httpError(404, "This record is no longer in the trash.");
  const labels = await findTrashLabels(c.get("workspaceId"), columns, row);
  return {
    id: params.record,
    deletedAt: Number(row.deleted_at),
    record: shapeRecord({ ...row, ...labels }, columns),
  };
});
