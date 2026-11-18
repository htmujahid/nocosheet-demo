import { resourceTable, viewTable } from "@db/schema";
import { and, asc, db, eq, inArray, sql } from "void/db";

import type { Column, Table } from "../tables/repository";
import type { ViewPatchValues, ViewValues } from "./validation";

export type View = typeof viewTable.$inferSelect;

export async function listViews(tableId: number) {
  return db
    .select()
    .from(viewTable)
    .where(eq(viewTable.tableId, tableId))
    .orderBy(asc(viewTable.position), asc(viewTable.id));
}

export async function findViews(tableId: number, ids: number[]) {
  return db
    .select({ id: viewTable.id, name: viewTable.name })
    .from(viewTable)
    .where(and(eq(viewTable.tableId, tableId), inArray(viewTable.id, ids)));
}

export async function findView(tableId: number, id: number) {
  const [row] = await db
    .select()
    .from(viewTable)
    .where(and(eq(viewTable.tableId, tableId), eq(viewTable.id, id)))
    .limit(1);
  return row;
}

export async function findViewsUsingColumn(tableId: number, columnName: string) {
  const views = await db.select().from(viewTable).where(eq(viewTable.tableId, tableId));
  return views.filter(
    (view) =>
      view.selectColumns.includes(columnName) || view.whereExpression.some((condition) => condition.column === columnName),
  );
}

export async function createView(table: Table, columns: Column[], body: ViewValues, userId: string) {
  const selected = columns
    .filter((column) => body.selectColumns.includes(column.columnName))
    .map((column) => column.columnName);

  const [, inserted] = await db.batch([
    db.insert(resourceTable).values({ kind: "view" }),
    db
      .insert(viewTable)
      .values({
        id: sql`last_insert_rowid()`,
        tableId: table.id,
        name: body.name,
        description: body.description,
        icon: body.icon,
        type: "grid",
        position: sql`(select coalesce(max(position), -1) + 1 from ${viewTable} where ${viewTable.tableId} = ${table.id})`,
        selectColumns: selected,
        whereExpression: body.filters,
        createdBy: userId,
      })
      .returning(),
  ]);
  return inserted[0];
}

export async function updateView(id: number, body: ViewPatchValues) {
  const [updated] = await db
    .update(viewTable)
    .set({
      name: body.name,
      description: body.description,
      icon: body.icon,
      updatedAt: new Date(),
    })
    .where(eq(viewTable.id, id))
    .returning();
  return updated;
}

export async function deleteViews(ids: number[]) {
  await db.delete(resourceTable).where(inArray(resourceTable.id, ids));
}
