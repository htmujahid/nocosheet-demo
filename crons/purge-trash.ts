import { defineScheduled } from "void";

import { purgeExpiredForms } from "@/lib/forms/repository";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { purgeExpiredTrashEntries } from "@/lib/records/trash-repository";
import { purgeExpiredColumns, purgeExpiredTables } from "@/lib/tables/repository";
import { purgeExpiredViews } from "@/lib/views/repository";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const cron = "0 3 * * *";

export default defineScheduled(async () => {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const records = await purgeExpiredTrashEntries(cutoff);
  const views = await purgeExpiredViews(DEFAULT_WORKSPACE, cutoff);
  const forms = await purgeExpiredForms(cutoff);
  const columns = await purgeExpiredColumns(DEFAULT_WORKSPACE, cutoff);
  const tables = await purgeExpiredTables(DEFAULT_WORKSPACE, cutoff);
  console.log(
    `Purged ${records} expired trash entries, ${views} expired views, ${forms} expired forms, ${columns} expired columns and ${tables} expired tables`,
  );
});
