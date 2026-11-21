import { auditTable, favoriteTable, resourceTable, settingTable, tableTable } from "@db/schema";
import { db, sql } from "void/db";

import { physicalTableName, quoteIdent } from "../tables/naming";

export async function resetWorkspace(workspace: string) {
  const rows = await db.select({ tableName: tableTable.tableName }).from(tableTable);
  const names = rows.map((row) => physicalTableName(workspace, row.tableName));

  await db.batch([
    db.run(sql`pragma defer_foreign_keys = on`),
    ...names.map((name) => db.run(sql.raw(`DROP TABLE ${quoteIdent(name)}`))),
    db.delete(favoriteTable),
    db.delete(auditTable),
    db.delete(settingTable),
    db.delete(resourceTable),
  ] as never);

  return { tables: names.length };
}
