import { httpError } from "../http";
import type { AccessGrant } from "./grants";
import { findExistingResourceIds } from "./repository";

export async function assertGrantable(grants: AccessGrant[]) {
  const ids = [...new Set(grants.flatMap((entry) => (entry.resourceId ? [entry.resourceId] : [])))];
  const existing = await findExistingResourceIds(ids);
  if (ids.some((id) => !existing.has(id)))
    throw httpError(400, "A table in the grants no longer exists.");
}
