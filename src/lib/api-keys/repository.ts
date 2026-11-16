import { and, db, desc, eq } from "void/db";

import { apikeyTable } from "../../../.void/better-auth-schema";

const apiKeyColumns = {
  id: apikeyTable.id,
  name: apikeyTable.name,
  start: apikeyTable.start,
  enabled: apikeyTable.enabled,
  expiresAt: apikeyTable.expiresAt,
  lastRequest: apikeyTable.lastRequest,
  requestCount: apikeyTable.requestCount,
  createdAt: apikeyTable.createdAt,
};

export async function listUserApiKeys(userId: string) {
  return db
    .select(apiKeyColumns)
    .from(apikeyTable)
    .where(eq(apikeyTable.referenceId, userId))
    .orderBy(desc(apikeyTable.createdAt), desc(apikeyTable.id));
}

export async function findUserApiKey(userId: string, keyId: string) {
  const [row] = await db
    .select(apiKeyColumns)
    .from(apikeyTable)
    .where(and(eq(apikeyTable.referenceId, userId), eq(apikeyTable.id, keyId)))
    .limit(1);
  return row;
}

export async function deleteApiKey(keyId: string) {
  await db.delete(apikeyTable).where(eq(apikeyTable.id, keyId));
}
