import { httpError } from "../http";
import { type Access, loadAccess } from "./access";
import {
  type Action,
  isFormGrantAllowed,
  isViewGrantAllowed,
  type PermissionGrant,
} from "./permissions";
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

export async function assertGrantable(grants: PermissionGrant[]) {
  const ids = [...new Set(grants.flatMap((grant) => (grant.resourceId ? [grant.resourceId] : [])))];
  const kinds = await findGrantResourceKinds(ids);
  if (ids.some((id) => !kinds.has(id)))
    throw httpError(400, "A table, view or form in the permissions no longer exists.");

  if (
    grants.some(
      (grant) =>
        grant.resourceId !== null &&
        kinds.get(grant.resourceId) === "form" &&
        !isFormGrantAllowed(grant),
    )
  )
    throw httpError(400, "A form can only be given the create permission.");

  if (
    grants.some(
      (grant) =>
        grant.resourceId !== null &&
        kinds.get(grant.resourceId) === "view" &&
        !isViewGrantAllowed(grant),
    )
  )
    throw httpError(400, "A view can't be given the create permission. Use the table or a form.");
}
