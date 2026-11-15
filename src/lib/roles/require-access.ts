import type { Context, Env } from "hono";
import { type AuthUser, requireAuth } from "void/auth";

import { httpError, NOT_FOUND } from "../http";
import { type Access, loadAccess } from "./access";
import type { Action } from "./permissions";
import { resourceInTable } from "./repository";

const DENIED: Record<Action, string> = {
  create: "You don't have permission to create records here.",
  read: "You don't have permission to view these records.",
  update: "You don't have permission to edit these records.",
  delete: "You don't have permission to delete these records.",
  export: "You don't have permission to export these records.",
};

const VISIBLE_ACTIONS: Action[] = ["read", "create", "update"];

function denied(access: Access, action: Action, tableId: number, resourceId?: number | null) {
  const visible = VISIBLE_ACTIONS.some(
    (item) => access.scope(item, tableId, resourceId) !== "none",
  );
  return visible ? httpError(403, DENIED[action]) : httpError(404, NOT_FOUND);
}

export async function requireAccess<E extends Env & { Variables: { user: AuthUser | null } }>(
  c: Context<E>,
  actions: Action | Action[],
  tableId: number,
  resourceId?: number | null,
) {
  const user = requireAuth(c);
  const list = Array.isArray(actions) ? actions : [actions];
  const access = await loadAccess(user);
  const granted = list
    .map((action) => ({ action, scope: access.scope(action, tableId, resourceId) }))
    .filter((item) => item.scope !== "none");
  const best = granted.find((item) => item.scope === "all") ?? granted[0];
  if (!best) throw denied(access, list[0], tableId, resourceId);
  if (resourceId && !(await resourceInTable(resourceId, tableId))) throw httpError(404, NOT_FOUND);
  return { ...best, ownerId: best.scope === "own" ? user.id : undefined };
}
