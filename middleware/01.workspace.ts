import { defineMiddleware } from "void";
import { requireAuth } from "void/auth";

import { httpError } from "@/lib/http";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

declare module "void" {
  interface CloudContextVariables {
    workspaceId: string;
  }
}

export default defineMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/api/workspaces/")) return next();

  requireAuth(c);

  const workspaceId = c.req.path.split("/")[3];
  if (workspaceId !== DEFAULT_WORKSPACE) {
    throw httpError(404, "Workspace not found.");
  }

  c.set("workspaceId", workspaceId);
  return next();
});
