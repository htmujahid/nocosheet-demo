import { isAdmin } from "../auth/access";
import { type Action, type AccessGrant, type Scope, scopeOf } from "./grants";
import { listUserGrants } from "./repository";

export type Access = {
  admin: boolean;
  grants: AccessGrant[];
  scope: (tableId: number | null, action: Action) => Scope;
};

export async function loadAccess(user: { id: string; role?: string | null }): Promise<Access> {
  if (isAdmin(user)) return { admin: true, grants: [], scope: () => "all" };

  const grants = await listUserGrants(user.id);
  return { admin: false, grants, scope: (tableId, action) => scopeOf(grants, tableId, action) };
}
