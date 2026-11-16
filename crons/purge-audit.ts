import { defineScheduled } from "void";

import { purgeExpiredAudit } from "@/lib/audit/repository";
import { auditExpiry } from "@/lib/audit/retention";

export const cron = "0 4 * * *";

export default defineScheduled(async () => {
  const purged = await purgeExpiredAudit(auditExpiry());
  console.log(`Purged ${purged} expired audit log entries`);
});
