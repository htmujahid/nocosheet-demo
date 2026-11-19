import { formTable, resourceTable } from "@db/schema";
import { and, asc, db, eq, inArray, sql } from "void/db";

import type { Table } from "../tables/repository";
import { newFormKey } from "./naming";
import type { FormValues } from "./validation";

export type Form = typeof formTable.$inferSelect;

export async function listForms(tableId: number) {
  return db
    .select()
    .from(formTable)
    .where(eq(formTable.tableId, tableId))
    .orderBy(asc(formTable.position), asc(formTable.id));
}

export async function findForm(tableId: number, id: number) {
  const [row] = await db
    .select()
    .from(formTable)
    .where(and(eq(formTable.tableId, tableId), eq(formTable.id, id)))
    .limit(1);
  return row;
}

export function buildFormStatements(table: Pick<Table, "id">, body: FormValues, userId: string) {
  return [
    db.insert(resourceTable).values({ kind: "form" }),
    db
      .insert(formTable)
      .values({
        id: sql`last_insert_rowid()`,
        tableId: table.id,
        formKey: newFormKey(),
        name: body.name,
        description: body.description,
        icon: body.icon,
        isOpen: body.isOpen,
        selectColumns: body.selectColumns,
        position: sql`(select coalesce(max(position), -1) + 1 from ${formTable} where ${formTable.tableId} = ${table.id})`,
        createdBy: userId,
      })
      .returning(),
  ] as const;
}

export async function createForm(table: Table, body: FormValues, userId: string) {
  const [, inserted] = await db.batch(buildFormStatements(table, body, userId));
  return inserted[0];
}

export async function updateForm(id: number, body: FormValues) {
  const [updated] = await db
    .update(formTable)
    .set({
      name: body.name,
      description: body.description,
      icon: body.icon,
      isOpen: body.isOpen,
      selectColumns: body.selectColumns,
      updatedAt: new Date(),
    })
    .where(eq(formTable.id, id))
    .returning();
  return updated;
}

export async function findForms(tableId: number, ids: number[]) {
  return db
    .select({ id: formTable.id, name: formTable.name })
    .from(formTable)
    .where(and(eq(formTable.tableId, tableId), inArray(formTable.id, ids)));
}

export async function deleteForms(ids: number[]) {
  await db.delete(resourceTable).where(inArray(resourceTable.id, ids));
}

export async function findFormsUsingColumn(tableId: number, columnName: string) {
  const forms = await db.select().from(formTable).where(eq(formTable.tableId, tableId));
  return forms.filter((form) => form.selectColumns.includes(columnName));
}
