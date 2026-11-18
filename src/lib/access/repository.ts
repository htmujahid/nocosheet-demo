import {
  formTable,
  accessProfileMemberTable,
  accessGrantTable,
  accessProfileTable,
  tableTable,
  viewTable,
} from "@db/schema";
import { and, asc, count, db, desc, eq, inArray, isNull, sql } from "void/db";

import type { AccessGrant, ProfileKind } from "./grants";

export type AccessProfile = typeof accessProfileTable.$inferSelect;

const INSERT_CHUNK = 30;

const profileWithGrants = {
  id: accessProfileTable.id,
  name: accessProfileTable.name,
  description: accessProfileTable.description,
  isSystem: accessProfileTable.isSystem,
  isDefault: accessProfileTable.isDefault,
  kind: accessProfileTable.kind,
  position: accessProfileTable.position,
  memberCount: sql<number>`(select count(*) from ${accessProfileMemberTable} m where m.profile_id = ${accessProfileTable}.id)`,
  grants: sql<string>`(select json_group_array(json_object('resourceId', p.resource_id, 'grant', p.grant)) from ${accessGrantTable} p where p.profile_id = ${accessProfileTable}.id)`,
};

const withParsedGrants = <T extends { grants: string }>(row: T) => ({
  ...row,
  grants: JSON.parse(row.grants) as AccessGrant[],
});

export async function listProfilesWithGrants() {
  const rows = await db
    .select(profileWithGrants)
    .from(accessProfileTable)
    .orderBy(asc(accessProfileTable.position), asc(accessProfileTable.id));
  return rows.map(withParsedGrants);
}

export async function findProfileWithGrants(id: number) {
  const [row] = await db
    .select(profileWithGrants)
    .from(accessProfileTable)
    .where(eq(accessProfileTable.id, id))
    .limit(1);
  return row ? withParsedGrants(row) : undefined;
}

export async function findProfile(id: number) {
  const [row] = await db.select().from(accessProfileTable).where(eq(accessProfileTable.id, id)).limit(1);
  return row as AccessProfile | undefined;
}

export async function findProfileByName(name: string) {
  const [row] = await db
    .select()
    .from(accessProfileTable)
    .where(sql`lower(${accessProfileTable.name}) = lower(${name})`)
    .limit(1);
  return row as AccessProfile | undefined;
}

export async function findDefaultProfile() {
  const [row] = await db.select().from(accessProfileTable).where(eq(accessProfileTable.isDefault, true)).limit(1);
  return row as AccessProfile | undefined;
}

export async function findProfileByKind(kind: Exclude<ProfileKind, "custom">) {
  const [row] = await db.select().from(accessProfileTable).where(eq(accessProfileTable.kind, kind)).limit(1);
  return row as AccessProfile | undefined;
}

export async function nextProfilePosition() {
  const [row] = await db
    .select({ position: accessProfileTable.position })
    .from(accessProfileTable)
    .orderBy(desc(accessProfileTable.position))
    .limit(1);
  return (row?.position ?? -1) + 1;
}

export async function createProfile(values: { name: string; description?: string | null }) {
  const [created] = await db
    .insert(accessProfileTable)
    .values({
      name: values.name,
      description: values.description ?? null,
      position: await nextProfilePosition(),
    })
    .returning();
  return created;
}

export async function updateProfile(
  id: number,
  values: { name?: string; description?: string | null },
) {
  const [updated] = await db
    .update(accessProfileTable)
    .set({
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.description !== undefined ? { description: values.description } : {}),
      updatedAt: new Date(),
    })
    .where(eq(accessProfileTable.id, id))
    .returning();
  return updated;
}

export async function makeDefaultProfile(id: number) {
  await db.batch([
    db.update(accessProfileTable).set({ isDefault: false }).where(eq(accessProfileTable.isDefault, true)),
    db
      .update(accessProfileTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(accessProfileTable.id, id)),
  ]);
}

export async function deleteProfile(id: number) {
  await db.delete(accessProfileTable).where(eq(accessProfileTable.id, id));
}

export async function countProfileMembers(profileId: number) {
  const [row] = await db
    .select({ total: count() })
    .from(accessProfileMemberTable)
    .where(eq(accessProfileMemberTable.profileId, profileId));
  return row?.total ?? 0;
}

export async function replaceGrants(profileId: number, grants: AccessGrant[]) {
  const inserts = [];
  for (let start = 0; start < grants.length; start += INSERT_CHUNK)
    inserts.push(
      db.insert(accessGrantTable).values(
        grants.slice(start, start + INSERT_CHUNK).map((entry) => ({
          profileId,
          resourceId: entry.resourceId,
          grant: entry.grant,
        })),
      ),
    );

  await db.batch([
    db.delete(accessGrantTable).where(eq(accessGrantTable.profileId, profileId)),
    db.update(accessProfileTable).set({ updatedAt: new Date() }).where(eq(accessProfileTable.id, profileId)),
    ...inserts,
  ] as never);
}

export async function listAssignments() {
  return db
    .select({ userId: accessProfileMemberTable.userId, profileId: accessProfileMemberTable.profileId })
    .from(accessProfileMemberTable);
}

export async function assignProfile(userId: string, profileId: number, assignedBy: string) {
  await db
    .insert(accessProfileMemberTable)
    .values({ userId, profileId, assignedBy })
    .onConflictDoUpdate({
      target: accessProfileMemberTable.userId,
      set: { profileId, assignedBy, assignedAt: new Date() },
    });
}

export async function findUserProfile(userId: string) {
  const [assigned] = await db
    .select({ profileId: accessProfileMemberTable.profileId })
    .from(accessProfileMemberTable)
    .where(eq(accessProfileMemberTable.userId, userId))
    .limit(1);
  if (assigned) return findProfile(assigned.profileId);
  return findDefaultProfile();
}

export async function listGrantsForProfile(profileId: number) {
  const rows = await db
    .select({
      resourceId: accessGrantTable.resourceId,
      grant: accessGrantTable.grant,
    })
    .from(accessGrantTable)
    .where(and(eq(accessGrantTable.profileId, profileId)));
  return rows as AccessGrant[];
}

export async function listTableResourceIds(tableId: number) {
  const [views, forms] = await db.batch([
    db
      .select({ id: viewTable.id })
      .from(viewTable)
      .where(eq(viewTable.tableId, tableId)),
    db
      .select({ id: formTable.id })
      .from(formTable)
      .where(eq(formTable.tableId, tableId)),
  ]);
  return [...views, ...forms].map((row) => row.id);
}

export async function resourceInTable(resourceId: number, tableId: number) {
  const [views, forms] = await db.batch([
    db
      .select({ id: viewTable.id })
      .from(viewTable)
      .where(
        and(
          eq(viewTable.id, resourceId),
          eq(viewTable.tableId, tableId),
        ),
      )
      .limit(1),
    db
      .select({ id: formTable.id })
      .from(formTable)
      .where(
        and(
          eq(formTable.id, resourceId),
          eq(formTable.tableId, tableId),
        ),
      )
      .limit(1),
  ]);
  return views.length + forms.length > 0;
}

export async function findGrantResourceKinds(ids: number[]) {
  if (ids.length === 0) return new Map<number, "table" | "view" | "form">();
  const [tables, views, forms] = await db.batch([
    db
      .select({ id: tableTable.id })
      .from(tableTable)
      .where(and(inArray(tableTable.id, ids), isNull(tableTable.deletedAt))),
    db
      .select({ id: viewTable.id })
      .from(viewTable)
      .innerJoin(tableTable, eq(viewTable.tableId, tableTable.id))
      .where(
        and(inArray(viewTable.id, ids), isNull(tableTable.deletedAt)),
      ),
    db
      .select({ id: formTable.id })
      .from(formTable)
      .innerJoin(tableTable, eq(formTable.tableId, tableTable.id))
      .where(
        and(inArray(formTable.id, ids), isNull(tableTable.deletedAt)),
      ),
  ]);
  const kinds = new Map<number, "table" | "view" | "form">();
  for (const row of tables) kinds.set(row.id, "table");
  for (const row of views) kinds.set(row.id, "view");
  for (const row of forms) kinds.set(row.id, "form");
  return kinds;
}

export async function listGrantTargets() {
  const [tables, views, forms] = await db.batch([
    db
      .select({ id: tableTable.id, name: tableTable.name, icon: tableTable.icon })
      .from(tableTable)
      .where(isNull(tableTable.deletedAt))
      .orderBy(asc(tableTable.position), asc(tableTable.id)),
    db
      .select({
        id: viewTable.id,
        tableId: viewTable.tableId,
        name: viewTable.name,
        icon: viewTable.icon,
      })
      .from(viewTable)
      .innerJoin(tableTable, eq(viewTable.tableId, tableTable.id))
      .where(isNull(tableTable.deletedAt))
      .orderBy(asc(viewTable.position), asc(viewTable.id)),
    db
      .select({
        id: formTable.id,
        tableId: formTable.tableId,
        name: formTable.name,
        icon: formTable.icon,
      })
      .from(formTable)
      .innerJoin(tableTable, eq(formTable.tableId, tableTable.id))
      .where(isNull(tableTable.deletedAt))
      .orderBy(asc(formTable.position), asc(formTable.id)),
  ]);
  return tables.map((table) => ({
    ...table,
    views: views.filter((view) => view.tableId === table.id),
    forms: forms.filter((form) => form.tableId === table.id),
  }));
}
