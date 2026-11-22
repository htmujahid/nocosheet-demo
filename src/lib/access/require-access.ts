import type { Context, Env } from "hono";
import { type AuthUser, requireAuth } from "void/auth";

import { httpError, NOT_FOUND } from "../http";
import type { Action } from "./grants";
import { type Access, loadAccess } from "./load-access";

const DENIED: Record<Action, string> = {
  create: "You don't have access to create records here.",
  read: "You don't have access to view these records.",
  update: "You don't have access to edit these records.",
  delete: "You don't have access to delete these records.",
  export: "You don't have access to export these records.",
};

const VISIBLE_ACTIONS: Action[] = ["read", "create", "update"];

function denied(access: Access, tableId: number, action: Action) {
  const visible = VISIBLE_ACTIONS.some((item) => access.scope(tableId, item) !== "none");
  return visible ? httpError(403, DENIED[action]) : httpError(404, NOT_FOUND);
}

export async function requireAccess<E extends Env & { Variables: { user: AuthUser | null } }>(
  c: Context<E>,
  tableId: number,
  actions: Action | Action[],
) {
  const user = requireAuth(c);
  const list = Array.isArray(actions) ? actions : [actions];
  const access = await loadAccess(user);
  const granted = list
    .map((action) => ({ action, scope: access.scope(tableId, action) }))
    .filter((item) => item.scope !== "none");
  const best = granted.find((item) => item.scope === "all") ?? granted[0];
  if (!best) throw denied(access, tableId, list[0]);
  return { ...best, ownerId: best.scope === "own" ? user.id : undefined };
}

/** Passes when any one of `actions` is allowed on the table. */
export async function requireAnyAccess<E extends Env & { Variables: { user: AuthUser | null } }>(
  c: Context<E>,
  tableId: number,
  actions: Action[],
) {
  const access = await loadAccess(requireAuth(c));
  if (actions.some((action) => access.scope(tableId, action) !== "none")) return;
  throw denied(access, tableId, actions[0]);
}
