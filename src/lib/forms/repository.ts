import { formTable, resourceTable } from "@db/schema";
import { and, asc, db, desc, eq, inArray, isNotNull, isNull, lt, sql } from "void/db";

import type { Table } from "../tables/repository";
import { TRASH_LIST_LIMIT } from "../trash/query";
import { newFormKey } from "./naming";
import type { FormValues } from "./validation";

export type Form = typeof formTable.$inferSelect;

export async function listForms(tableId: number) {
  return db
    .select()
    .from(formTable)
    .where(and(eq(formTable.tableId, tableId), isNull(formTable.deletedAt)))
    .orderBy(asc(formTable.position), asc(formTable.id));
}

export async function findForm(tableId: number, id: number) {
  const [row] = await db
    .select()
    .from(formTable)
    .where(and(eq(formTable.tableId, tableId), eq(formTable.id, id), isNull(formTable.deletedAt)))
    .limit(1);
  return row;
}

export async function createForm(table: Table, body: FormValues, userId: string) {
  const [, inserted] = await db.batch([
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
  ]);
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

export async function softDeleteForm(id: number, userId: string) {
  await db
    .update(formTable)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(eq(formTable.id, id));
}

export async function findForms(tableId: number, ids: number[]) {
  return db
    .select({ id: formTable.id, name: formTable.name })
    .from(formTable)
    .where(
      and(eq(formTable.tableId, tableId), inArray(formTable.id, ids), isNull(formTable.deletedAt)),
    );
}

export async function softDeleteForms(ids: number[], userId: string) {
  await db
    .update(formTable)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(inArray(formTable.id, ids));
}

export async function findDeletedForm(tableId: number, id: number) {
  const [row] = await db
    .select()
    .from(formTable)
    .where(
      and(eq(formTable.tableId, tableId), eq(formTable.id, id), isNotNull(formTable.deletedAt)),
    )
    .limit(1);
  return row;
}

export async function restoreForm(id: number) {
  await db.update(formTable).set({ deletedAt: null, deletedBy: null }).where(eq(formTable.id, id));
}

export async function purgeForm(id: number) {
  await db.delete(resourceTable).where(eq(resourceTable.id, id));
}

export async function purgeExpiredForms(cutoff: Date) {
  const expired = await db
    .select({ id: formTable.id })
    .from(formTable)
    .where(and(isNotNull(formTable.deletedAt), lt(formTable.deletedAt, cutoff)));
  for (const form of expired) await purgeForm(form.id);
  return expired.length;
}

export async function listDeletedForms(tableId: number) {
  const rows = await db
    .select({
      id: formTable.id,
      name: formTable.name,
      description: formTable.description,
      icon: formTable.icon,
      deletedAt: formTable.deletedAt,
      deletedBy: formTable.deletedBy,
      deletedByName: sql<
        string | null
      >`(select u."name" from "user" u where u."id" = ${formTable.deletedBy})`,
    })
    .from(formTable)
    .where(and(eq(formTable.tableId, tableId), isNotNull(formTable.deletedAt)))
    .orderBy(desc(formTable.deletedAt), asc(formTable.id))
    .limit(TRASH_LIST_LIMIT);

  return rows.map(({ deletedBy, deletedByName, ...row }) => ({
    ...row,
    deletedAt: row.deletedAt?.getTime() ?? 0,
    deletedBy: deletedBy ? { id: deletedBy, label: deletedByName } : null,
  }));
}

export async function findFormsUsingColumn(tableId: number, columnName: string) {
  const forms = await db.select().from(formTable).where(eq(formTable.tableId, tableId));
  return forms.filter((form) => form.selectColumns.includes(columnName));
}
