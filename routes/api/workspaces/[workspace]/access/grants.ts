import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { loadAccess } from "@/lib/access/load-access";

export const GET = defineHandler(async (c) => {
  const access = await loadAccess(requireAuth(c));
  return { rows: access.grants };
});
