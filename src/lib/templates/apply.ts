import { columnTable, tableTable } from "@db/schema";
import { db, eq, isNull, sql } from "void/db";

import { buildFormStatements } from "../forms/repository";
import { buildRecordInserts } from "../records/repository";
import {
  buildColumnInsert,
  buildTableStatements,
  dropTables,
  type Table,
} from "../tables/repository";
import { buildViewStatements } from "../views/repository";
import { planTemplate } from "./plan";
import type { Template } from "./schema";

const BATCH_SIZE = 100;

type Statement = unknown;

async function runGroups(groups: Statement[][]) {
  let batch: Statement[] = [];
  for (const group of groups) {
    if (batch.length && batch.length + group.length > BATCH_SIZE) {
      await db.batch(batch as never);
      batch = [];
    }
    batch.push(...group);
  }
  if (batch.length) await db.batch(batch as never);
}

export async function applyTemplate(
  workspace: string,
  template: Template,
  userId: string,
  options: { sampleData: boolean },
) {
  const taken = new Set(
    (
      await db.select({ name: tableTable.name }).from(tableTable).where(isNull(tableTable.deletedAt))
    ).map((row) => row.name.toLowerCase()),
  );

  const plan = planTemplate(workspace, template, taken, options);

  const results = (await db.batch(
    plan.tables.flatMap((table) =>
      buildTableStatements(table.tableName, table.input, userId, table.ddl),
    ) as never,
  )) as unknown[];

  let offset = 0;
  const created = plan.tables.map((table) => {
    offset += table.ddl.length + 2;
    return (results[offset - 1] as Table[])[0];
  });

  try {
    const groups: Statement[][] = [];

    plan.tables.forEach((table, index) => {
      const row = created[index];

      for (const column of table.columns) {
        const body =
          column.relationTable === undefined
            ? column.body
            : {
                ...column.body,
                options: { ...column.body.options, tableId: created[column.relationTable].id },
              };
        groups.push([
          buildColumnInsert(
            row.id,
            column.columnName,
            body,
            column.sqliteType,
            column.check,
            column.generated,
          ),
        ]);
      }

      if (table.titleColumn)
        groups.push([
          db
            .update(tableTable)
            .set({
              titleColumnId: sql`(select ${columnTable.id} from ${columnTable} where ${columnTable.tableId} = ${row.id} and ${columnTable.columnName} = ${table.titleColumn})`,
            })
            .where(eq(tableTable.id, row.id)),
        ]);

      for (const view of table.views)
        groups.push([...buildViewStatements(row, table.columns, view, userId)]);
      for (const form of table.forms) groups.push([...buildFormStatements(row, form, userId)]);
    });

    for (const index of plan.rowOrder) {
      const { rows } = plan.tables[index];
      for (const statement of buildRecordInserts(
        workspace,
        created[index],
        rows.map((row) => row.values),
        userId,
        rows.map((row) => row.id),
      ))
        groups.push([statement]);
    }

    await runGroups(groups);
  } catch (error) {
    await dropTables(
      workspace,
      created.map(({ id, tableName }) => ({ id, tableName })),
    ).catch(() => undefined);
    throw error;
  }

  return { tables: created.map(({ id, name }) => ({ id, name })) };
}
