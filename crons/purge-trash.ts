import { defineScheduled } from "void";

import { purgeExpiredRecords } from "@/lib/records/repository";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { purgeExpiredColumns, purgeExpiredTables } from "@/lib/tables/repository";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const cron = "0 3 * * *";

export default defineScheduled(async () => {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const records = await purgeExpiredRecords(DEFAULT_WORKSPACE, cutoff);
  const columns = await purgeExpiredColumns(DEFAULT_WORKSPACE, cutoff);
  const tables = await purgeExpiredTables(DEFAULT_WORKSPACE, cutoff);
  console.log(
    `Purged ${records} expired records, ${columns} expired columns and ${tables} expired tables`,
  );
});
