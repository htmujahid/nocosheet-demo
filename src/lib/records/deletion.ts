import { db } from "void/db";

import { classifyDbError } from "../db-errors";
import type { Column, Table } from "../tables/repository";
import { listColumns } from "../tables/repository";
import {
  buildSoftDeletes,
  type ClearStep,
  type DeletionStep,
  findLinkedIds,
  findRecordsByIds,
  listReferencingColumns,
} from "./repository";

type Plan = { deletions: DeletionStep[]; clears: ClearStep[] };

const onDeleteOf = (column: Column) => (column.options as { onDelete?: string }).onDelete;
const keyOf = (table: Table, id: number) => `${table.id}:${id}`;

async function expand(
  workspace: string,
  table: Table,
  ids: number[],
  plan: Plan,
  seen: Set<string>,
): Promise<void> {
  const fresh = ids.filter((id) => !seen.has(keyOf(table, id)));
  if (fresh.length === 0) return;
  for (const id of fresh) seen.add(keyOf(table, id));
  plan.deletions.push({ table, ids: fresh });

  for (const { column, table: source } of await listReferencingColumns(table.id)) {
    if (onDeleteOf(column) !== "cascade") continue;
    const linked = await findLinkedIds(workspace, source, column, fresh);
    await expand(workspace, source, linked, plan, seen);
  }
}

async function inspect(workspace: string, plan: Plan, seen: Set<string>) {
  for (const { table, ids } of plan.deletions) {
    for (const { column, table: source } of await listReferencingColumns(table.id)) {
      const mode = onDeleteOf(column);
      if (mode === "cascade") continue;
      const outside = (await findLinkedIds(workspace, source, column, ids)).filter(
        (id) => !seen.has(keyOf(source, id)),
      );
      if (outside.length === 0) continue;
      if (mode === "restrict") return true;
      plan.clears.push({ table: source, column, ids: outside });
    }
  }
  return false;
}

export type DeleteResult =
  | { ok: true; deleted: number[] }
  | { ok: false; reason: "linked" | "failed"; message: string };

export async function deleteRecords(
  workspace: string,
  table: Table,
  ids: number[],
  userId: string,
): Promise<DeleteResult> {
  const columns = await listColumns(table.id);
  const live = (await findRecordsByIds(workspace, table, columns, [...new Set(ids)]))
    .filter((row) => row.deleted_at === null)
    .map((row) => Number(row.id));
  if (live.length === 0) return { ok: true, deleted: [] };

  const plan: Plan = { deletions: [], clears: [] };
  const seen = new Set<string>();
  await expand(workspace, table, live, plan, seen);

  if (await inspect(workspace, plan, seen))
    return {
      ok: false,
      reason: "linked",
      message: "Some of these records are still linked from other records.",
    };

  try {
    await db.batch(buildSoftDeletes(workspace, plan.deletions, plan.clears, userId) as never);
    return { ok: true, deleted: live };
  } catch (error) {
    return { ok: false, reason: "failed", message: classifyDbError(error).message };
  }
}
