import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import { resetWorkspace } from "@/lib/workspace/reset";

export const POST = defineHandler(async (c) => {
  requireAdmin(c);
  try {
    return await resetWorkspace(c.get("workspaceId"));
  } catch (error) {
    throw httpError(
      409,
      error instanceof Error ? error.message : "The workspace could not be reset.",
    );
  }
});
