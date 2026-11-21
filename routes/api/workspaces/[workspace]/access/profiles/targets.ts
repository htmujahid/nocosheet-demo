import { defineHandler } from "void";

import { listGrantTargets } from "@/lib/access/repository";
import { requireAdmin } from "@/lib/auth/require-admin";

export const GET = defineHandler(async (c) => {
  requireAdmin(c);
  return listGrantTargets();
});
