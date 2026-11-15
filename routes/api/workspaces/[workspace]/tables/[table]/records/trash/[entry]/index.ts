import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError, NOT_FOUND } from "@/lib/http";
import { shapeRecord } from "@/lib/records/shape";
import {
  findSnapshotLabels,
  findTrashEntry,
  purgeTrashEntry,
} from "@/lib/records/trash-repository";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  entry: z.coerce.number().int().positive(),
});

const NOT_IN_TRASH = "This record is no longer in the trash.";

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const entry = await findTrashEntry(table, params.entry);
  if (!entry) throw httpError(404, NOT_IN_TRASH);

  const columns = await listColumns(table.id);
  const labels = await findSnapshotLabels(c.get("workspaceId"), columns, entry.data);
  return {
    id: entry.id,
    deletedAt: entry.deletedAt.getTime(),
    record: shapeRecord({ ...entry.data, ...labels }, columns),
  };
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  if (!(await purgeTrashEntry(table, params.entry))) throw httpError(404, NOT_IN_TRASH);
  return { ok: true };
});
