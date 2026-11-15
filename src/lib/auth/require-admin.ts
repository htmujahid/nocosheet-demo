import type { Context, Env } from "hono";
import { type AuthUser, requireAuth } from "void/auth";

import { httpError } from "../http";
import { isAdmin } from "./access";

export function requireAdmin<E extends Env & { Variables: { user: AuthUser | null } }>(
  c: Context<E>,
): AuthUser {
  const user = requireAuth(c);
  if (!isAdmin(user)) throw httpError(403, "Admin access required.");
  return user;
}
