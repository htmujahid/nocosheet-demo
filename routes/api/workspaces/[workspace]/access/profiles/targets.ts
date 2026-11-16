import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listGrantTargets } from "@/lib/access/repository";

export const GET = defineHandler(async (c) => {
  requireAdmin(c);
  return listGrantTargets();
});
