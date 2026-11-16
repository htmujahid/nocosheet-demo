import type { CloudContext } from "void";
import { type AuthUser, requireAuth } from "void/auth";

import { httpError } from "../http";

export function requireSession(c: CloudContext): AuthUser {
  const user = requireAuth(c);
  if (c.get("authMethod") === "api-key") throw httpError(403, "API keys can't manage API keys.");
  return user;
}
