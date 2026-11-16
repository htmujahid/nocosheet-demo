import { isAdmin } from "../auth/access";
import { type Action, type AccessGrant, type Scope, scopeOf } from "./grants";
import { findProfileByKind, findUserProfile, listGrantsForProfile } from "./repository";

export type Access = {
  admin: boolean;
  /** The access profile assigned to this member (or the default one); null for administrators. */
  profile: { id: number; name: string; description: string | null } | null;
  grants: AccessGrant[];
  scope: (action: Action, tableId: number | null, resourceId?: number | null) => Scope;
};

export async function loadAccess(user: { id: string; role?: string | null }): Promise<Access> {
  if (isAdmin(user)) return { admin: true, profile: null, grants: [], scope: () => "all" };

  const [profile, authenticated] = await Promise.all([
    findUserProfile(user.id),
    findProfileByKind("authenticated"),
  ]);
  const layers = await Promise.all(
    [profile, authenticated].map((item) => (item ? listGrantsForProfile(item.id) : [])),
  );
  const grants = layers.flat();
  return {
    admin: false,
    profile: profile
      ? { id: profile.id, name: profile.name, description: profile.description }
      : null,
    grants,
    scope: (action, tableId, resourceId) => scopeOf(grants, action, tableId, resourceId),
  };
}
