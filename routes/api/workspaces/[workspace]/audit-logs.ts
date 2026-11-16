import { defineHandler } from "void";

import { parseAuditCursor } from "@/lib/audit/cursor";
import { auditSearchSchema, resolveAuditQuery } from "@/lib/audit/query";
import { listAuditEntries } from "@/lib/audit/repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";

export const GET = defineHandler.withValidator({ query: auditSearchSchema })(async (
  c,
  { query },
) => {
  requireAdmin(c);
  const resolved = resolveAuditQuery(query);
  const cursor = resolved.cursor ? parseAuditCursor(resolved.cursor) : null;
  if (resolved.cursor && !cursor) throw httpError(400, "The page cursor is invalid.");
  return listAuditEntries({ ...resolved, cursor });
});
