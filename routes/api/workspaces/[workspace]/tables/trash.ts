import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listDeletedTables } from "@/lib/tables/repository";

export const GET = defineHandler(async (c) => {
  requireAdmin(c);
  return { rows: await listDeletedTables() };
});
