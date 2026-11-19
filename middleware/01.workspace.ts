import { defineMiddleware } from "void";
import { requireAuth } from "void/auth";

import { isBearerRequest } from "@/lib/auth/bearer";
import { httpError } from "@/lib/http";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

declare module "void" {
  interface CloudContextVariables {
    workspaceId: string;
    authMethod: "session" | "bearer";
  }
}

export default defineMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/api/workspaces/")) return next();

  const authMethod = isBearerRequest(c.req.raw.headers) ? "bearer" : "session";
  requireAuth(c);

  const workspaceId = c.req.path.split("/")[3];
  if (workspaceId !== DEFAULT_WORKSPACE) {
    throw httpError(404, "Workspace not found.");
  }

  c.set("workspaceId", workspaceId);
  c.set("authMethod", authMethod);
  return next();
});
