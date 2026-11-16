import { httpError } from "../http";
import { type Access, loadAccess } from "./load-access";
import {
  type Action,
  isFormGrantAllowed,
  isViewGrantAllowed,
  type AccessGrant,
} from "./grants";
import { findGrantResourceKinds } from "./repository";

type User = { id: string; role?: string | null };

export async function visibleResources<T extends { id: number }>(
  user: User,
  action: Action,
  tableId: number,
  rows: T[],
) {
  const access: Access = await loadAccess(user);
  return rows.filter((row) => access.scope(action, tableId, row.id) !== "none");
}

export async function assertGrantable(grants: AccessGrant[]) {
  const ids = [...new Set(grants.flatMap((entry) => (entry.resourceId ? [entry.resourceId] : [])))];
  const kinds = await findGrantResourceKinds(ids);
  if (ids.some((id) => !kinds.has(id)))
    throw httpError(400, "A table, view or form in the grants no longer exists.");

  if (
    grants.some(
      (entry) =>
        entry.resourceId !== null &&
        kinds.get(entry.resourceId) === "form" &&
        !isFormGrantAllowed(entry),
    )
  )
    throw httpError(400, "A form can only be granted create access.");

  if (
    grants.some(
      (entry) =>
        entry.resourceId !== null &&
        kinds.get(entry.resourceId) === "view" &&
        !isViewGrantAllowed(entry),
    )
  )
    throw httpError(400, "A view can't be granted create access. Use the table or a form.");
}
