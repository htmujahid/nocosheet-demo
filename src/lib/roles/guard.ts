import { httpError } from "../http";
import { type Access, loadAccess } from "./access";
import {
  type Action,
  isFormGrantAllowed,
  isGuestGrantAllowed,
  type PermissionGrant,
  type RoleKind,
  type Scope,
} from "./permissions";
import { findGrantResourceKinds, resourceInTable } from "./repository";

type User = { id: string; role?: string | null };

const DENIED: Record<Action, string> = {
  create: "You don't have permission to create records here.",
  read: "You don't have permission to view these records.",
  update: "You don't have permission to edit these records.",
  delete: "You don't have permission to delete these records.",
  export: "You don't have permission to export these records.",
};

export async function authorize(
  user: User,
  action: Action,
  tableId: number,
  resourceId?: number | null,
) {
  if (resourceId && !(await resourceInTable(resourceId, tableId)))
    throw httpError(404, "Not found.");
  const access: Access = await loadAccess(user);
  const scope: Scope = access.scope(action, tableId, resourceId);
  if (scope === "none") throw httpError(403, DENIED[action]);
  return { scope, ownerId: scope === "own" ? user.id : undefined };
}

export async function authorizeExport(user: User, tableId: number, resourceId?: number | null) {
  await authorize(user, "export", tableId, resourceId);
  return authorize(user, "read", tableId, resourceId);
}

export async function authorizeAny(
  user: User,
  actions: Action[],
  tableId: number,
  resourceId?: number | null,
) {
  if (resourceId && !(await resourceInTable(resourceId, tableId)))
    throw httpError(404, "Not found.");
  const access: Access = await loadAccess(user);
  const granted = actions
    .map((action) => ({ action, scope: access.scope(action, tableId, resourceId) }))
    .filter((item) => item.scope !== "none");
  const best = granted.find((item) => item.scope === "all") ?? granted[0];
  if (!best) throw httpError(403, DENIED[actions[0]]);
  return { ...best, ownerId: best.scope === "own" ? user.id : undefined };
}

export async function visibleResources<T extends { id: number }>(
  user: User,
  action: Action,
  tableId: number,
  rows: T[],
) {
  const access: Access = await loadAccess(user);
  return rows.filter((row) => access.scope(action, tableId, row.id) !== "none");
}

export async function assertGrantable(grants: PermissionGrant[], kind: RoleKind) {
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

  if (kind === "guest" && !grants.every(isGuestGrantAllowed))
    throw httpError(400, "Guests can only create or view records, table by table.");
}
