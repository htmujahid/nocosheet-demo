export const PROFILE_KINDS = ["custom", "authenticated"] as const;
export type ProfileKind = (typeof PROFILE_KINDS)[number];

export const ACTIONS = ["create", "read", "update", "delete", "export"] as const;
export type Action = (typeof ACTIONS)[number];

export const SCOPES = ["none", "own", "all"] as const;
export type Scope = (typeof SCOPES)[number];

export const GRANTS = [
  "create",
  "create:none",
  "export",
  "export:none",
  "read:own",
  "read:all",
  "read:none",
  "update:own",
  "update:all",
  "update:none",
  "delete:own",
  "delete:all",
  "delete:none",
] as const;
export type Grant = (typeof GRANTS)[number];

export type AccessGrant = { resourceId: number | null; grant: Grant };

export const actionOf = (grant: Grant) => grant.split(":")[0] as Action;

export const SCOPED_ACTIONS = ["read", "update", "delete"] as const;
export const FLAG_ACTIONS = ["create", "export"] as const;

export const isScopedAction = (action: Action): action is (typeof SCOPED_ACTIONS)[number] =>
  (SCOPED_ACTIONS as readonly string[]).includes(action);

export function levelOf(
  grants: AccessGrant[],
  tableId: number | null,
  action: Action,
): Scope | undefined {
  const find = (id: number | null) =>
    grants.find((entry) => entry.resourceId === id && actionOf(entry.grant) === action);
  const entry = (tableId !== null ? find(tableId) : undefined) ?? find(null);
  if (!entry) return undefined;
  if (isScopedAction(action)) return entry.grant.split(":")[1] as Scope;
  return entry.grant.endsWith(":none") ? "none" : "all";
}

export const scopeOf = (grants: AccessGrant[], tableId: number | null, action: Action) =>
  levelOf(grants, tableId, action) ?? "none";

export const scopeFor = (
  access: { admin: boolean; grants: AccessGrant[] },
  tableId: number | null,
  action: Action,
): Scope => (access.admin ? "all" : scopeOf(access.grants, tableId, action));

export const ACTION_LABELS: Record<Action, string> = {
  create: "Create records",
  read: "View records",
  update: "Edit records",
  delete: "Delete records",
  export: "Export records",
};

export const grantFor = (action: Action, scope: Scope): Grant =>
  (isScopedAction(action)
    ? `${action}:${scope}`
    : scope === "none"
      ? `${action}:none`
      : action) as Grant;
