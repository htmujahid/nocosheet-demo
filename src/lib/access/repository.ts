import {
  accessProfileMemberTable,
  accessGrantTable,
  accessProfileTable,
  nowMs,
  resourceTable,
  tableTable,
} from "@db/schema";
import { and, asc, count, db, desc, eq, inArray, isNull, or, sql } from "void/db";

import type { AccessGrant } from "./grants";

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
  const [row] = await db
    .select()
    .from(accessProfileTable)
    .where(eq(accessProfileTable.id, id))
    .limit(1);
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
      updatedAt: nowMs,
    })
    .where(eq(accessProfileTable.id, id))
    .returning();
  return updated;
}

export async function makeDefaultProfile(id: number) {
  await db.batch([
    db
      .update(accessProfileTable)
      .set({ isDefault: false })
      .where(eq(accessProfileTable.isDefault, true)),
    db
      .update(accessProfileTable)
      .set({ isDefault: true, updatedAt: nowMs })
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
    db
      .update(accessProfileTable)
      .set({ updatedAt: nowMs })
      .where(eq(accessProfileTable.id, profileId)),
    ...inserts,
  ] as never);
}

export async function listAssignments() {
  return db
    .select({
      userId: accessProfileMemberTable.userId,
      profileId: accessProfileMemberTable.profileId,
    })
    .from(accessProfileMemberTable);
}

export async function assignProfile(userId: string, profileId: number, assignedBy: string) {
  await db
    .insert(accessProfileMemberTable)
    .values({ userId, profileId, assignedBy })
    .onConflictDoUpdate({
      target: accessProfileMemberTable.userId,
      set: { profileId, assignedBy, assignedAt: nowMs },
    });
}

export async function findUserProfile(userId: string) {
  const [row] = await db
    .select({
      id: accessProfileTable.id,
      name: accessProfileTable.name,
      description: accessProfileTable.description,
    })
    .from(accessProfileTable)
    .leftJoin(accessProfileMemberTable, eq(accessProfileMemberTable.userId, userId))
    .where(
      or(
        eq(accessProfileTable.id, accessProfileMemberTable.profileId),
        and(isNull(accessProfileMemberTable.profileId), eq(accessProfileTable.isDefault, true)),
      ),
    )
    .limit(1);
  return row;
}

export async function listUserGrants(userId: string) {
  const rows = await db
    .select({ resourceId: accessGrantTable.resourceId, grant: accessGrantTable.grant })
    .from(accessGrantTable)
    .innerJoin(accessProfileTable, eq(accessProfileTable.id, accessGrantTable.profileId))
    .leftJoin(accessProfileMemberTable, eq(accessProfileMemberTable.userId, userId))
    .where(
      or(
        eq(accessProfileTable.kind, "authenticated"),
        eq(accessProfileTable.id, accessProfileMemberTable.profileId),
        and(isNull(accessProfileMemberTable.profileId), eq(accessProfileTable.isDefault, true)),
      ),
    )
    .orderBy(sql`case when ${accessProfileTable.kind} = 'authenticated' then 1 else 0 end`);
  return rows as AccessGrant[];
}

export async function findExistingResourceIds(ids: number[]) {
  if (ids.length === 0) return new Set<number>();
  const rows = await db
    .select({ id: resourceTable.id })
    .from(resourceTable)
    .where(inArray(resourceTable.id, ids));
  return new Set(rows.map((row) => row.id));
}

export async function listGrantTargets() {
  return db
    .select({ id: tableTable.id, name: tableTable.name, icon: tableTable.icon })
    .from(tableTable)
    .where(isNull(tableTable.deletedAt))
    .orderBy(asc(tableTable.position), asc(tableTable.id));
}
