import {
  auditTable,
  favoriteTable,
  resourceTable,
  settingTable,
  tableTable,
  trashTable,
} from "@db/schema";
import { db, sql } from "void/db";

import { buildDropTable } from "../tables/ddl";
import { physicalTableName } from "../tables/naming";

export async function resetWorkspace(workspace: string) {
  const rows = await db.select({ tableName: tableTable.tableName }).from(tableTable);
  const names = rows.map((row) => physicalTableName(workspace, row.tableName));

  await db.batch([
    db.run(sql`pragma defer_foreign_keys = on`),
    ...names.map((name) => db.run(sql.raw(buildDropTable(name)))),
    db.delete(favoriteTable),
    db.delete(trashTable),
    db.delete(auditTable),
    db.delete(settingTable),
    db.delete(resourceTable),
  ] as never);

  return { tables: names.length };
}
