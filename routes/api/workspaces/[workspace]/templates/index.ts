import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { summarize, TEMPLATES } from "@/lib/templates/catalog";

export const GET = defineHandler(async (c) => {
  requireAdmin(c);
  return TEMPLATES.map(summarize);
});
