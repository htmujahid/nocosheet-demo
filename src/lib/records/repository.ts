import { columnTable, tableTable } from "@db/schema";
import { and, db, eq, inArray, isNull, sql } from "void/db";
import { integer, sqliteTable, text } from "void/schema-d1";

import {
  buildCreateIndex,
  buildDropIndex,
  buildSystemIndexes,
  indexKind,
  indexName,
} from "../tables/ddl";
import type { ColumnFormat } from "../tables/formats";
import { physicalTableName, quoteIdent } from "../tables/naming";
import { type Column, findTable, listColumns, type Table } from "../tables/repository";
import type { TrashQuery } from "../trash/query";
import type { ParsedValue } from "./values";

type Fragment = ReturnType<typeof sql>;
export type Row = Record<string, unknown>;

const CHUNK = 50;
const NOW = sql`cast(unixepoch('subsec') * 1000 as integer)`;

const raw = (text: string) => sql.raw(text);
const physical = (workspace: string, table: Table) =>
  raw(quoteIdent(physicalTableName(workspace, table.tableName)));
const idList = (ids: unknown[]) =>
  sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
const chunks = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

const upgraded = new Set<string>();

export async function ensureRecordSchema(workspace: string, table: Table, columns?: Column[]) {
  const name = physicalTableName(workspace, table.tableName);
  if (upgraded.has(name)) return;
  const present = await db.all<{ name: string }>(
    sql`select "name" from pragma_table_info(${name}) where "name" = 'deleted_at'`,
  );
  if (present.length === 0) {
    const quoted = quoteIdent(name);
    await db.run(sql.raw(`ALTER TABLE ${quoted} ADD COLUMN "deleted_at" INTEGER`));
    await db.run(
      sql.raw(
        `ALTER TABLE ${quoted} ADD COLUMN "deleted_by" TEXT REFERENCES "user" ("id") ON DELETE SET NULL`,
      ),
    );
    for (const statement of buildSystemIndexes(name)) await db.run(sql.raw(statement));
    for (const column of columns ?? (await listColumns(table.id))) {
      if (indexKind(column) !== "uq") continue;
      const index = indexName(workspace, column.columnName, "uq");
      await db.run(sql.raw(buildDropIndex(index)));
      await db.run(
        sql.raw(
          buildCreateIndex(index, name, column.columnName, "uq", column.format as ColumnFormat),
        ),
      );
    }
  }
  upgraded.add(name);
}

export async function findRecordTable(workspace: string, tableId: number) {
  const table = await findTable(tableId);
  if (table) await ensureRecordSchema(workspace, table);
  return table;
}

export const SYSTEM_COLUMNS = ["id", "created_at", "updated_at", "created_by", "updated_by"];

export const isSyncedColumn = (column: Column) => column.format !== "binary";

const selectList = (columns: Column[], prefix = "") =>
  raw(
    [...SYSTEM_COLUMNS, ...columns.filter(isSyncedColumn).map((column) => column.columnName)]
      .map((name) => `${prefix}${quoteIdent(name)}`)
      .join(", "),
  );

const labelOf = (name: string) =>
  `(select u."name" from "user" u where u."id" = "${name}") as "${name}_label"`;

const syncSelectList = raw(`*, ${labelOf("created_by")}, ${labelOf("updated_by")}`);

export async function serverClock() {
  const [row] = await db.all<{ now: number }>(sql`select ${NOW} as now`);
  return Number(row?.now ?? Date.now());
}

export async function findSyncRows(
  workspace: string,
  table: Table,
  options: { since?: number; ownerId?: string },
) {
  const owner = options.ownerId ? sql`and "created_by" = ${options.ownerId}` : sql``;
  const live =
    options.since === undefined ? sql`"deleted_at" is null` : sql`"updated_at" >= ${options.since}`;
  return db.all<Row>(
    sql`select ${syncSelectList} from ${physical(workspace, table)} where ${live} ${owner} order by "id"`,
  );
}

export async function findRecord(
  workspace: string,
  table: Table,
  columns: Column[],
  recordId: number,
  ownerId?: string,
) {
  const [row] = await db.all<Row>(
    sql`select ${selectList(columns)} from ${physical(workspace, table)} where "id" = ${recordId} and "deleted_at" is null ${ownerId ? sql`and "created_by" = ${ownerId}` : sql``} limit 1`,
  );
  return row;
}

export async function findRecordsByIds(
  workspace: string,
  table: Table,
  columns: Column[],
  ids: number[],
) {
  const rows: Row[] = [];
  for (const part of chunks(ids, CHUNK))
    rows.push(
      ...(await db.all<Row>(
        sql`select ${selectList(columns)}, "deleted_at" from ${physical(workspace, table)} where "id" in (${idList(part)})`,
      )),
    );
  return rows;
}

export type BrokenLink = { column: Column; reason: "table" | "record" };

export async function findBrokenLink(
  workspace: string,
  parsed: ParsedValue<Column>[],
): Promise<BrokenLink | undefined> {
  for (const { column, value } of parsed) {
    if (column.format !== "relation" || value === null) continue;
    const [target] = await db
      .select()
      .from(tableTable)
      .where(
        and(
          eq(tableTable.id, Number((column.options as { tableId?: number }).tableId)),
          isNull(tableTable.deletedAt),
        ),
      )
      .limit(1);
    if (!target) return { column, reason: "table" };
    await ensureRecordSchema(workspace, target);
    const [found] = await db.all<{ found: number }>(
      sql`select 1 as found from ${raw(quoteIdent(physicalTableName(workspace, target.tableName)))} where "id" = ${value} and "deleted_at" is null limit 1`,
    );
    if (!found) return { column, reason: "record" };
  }
  return undefined;
}

export async function findExistingRecordIds(
  workspace: string,
  targetTableId: number,
  ids: number[],
) {
  const existing = new Set<number>();
  if (!ids.length) return existing;
  const [target] = await db
    .select()
    .from(tableTable)
    .where(and(eq(tableTable.id, targetTableId), isNull(tableTable.deletedAt)))
    .limit(1);
  if (!target) return existing;
  await ensureRecordSchema(workspace, target);

  const source = raw(quoteIdent(physicalTableName(workspace, target.tableName)));
  for (const part of chunks([...new Set(ids)], CHUNK)) {
    const rows = await db.all<{ id: number }>(
      sql`select "id" as "id" from ${source} where "id" in (${idList(part)}) and "deleted_at" is null`,
    );
    for (const row of rows) existing.add(row.id);
  }
  return existing;
}

export function recordsTable(workspace: string, table: Table, names: string[] = []) {
  return sqliteTable(
    physicalTableName(workspace, table.tableName),
    Object.fromEntries(
      ["id", ...names].map((name) => [name, name === "id" ? integer(name) : text(name)]),
    ),
  );
}

type RecordsTable = ReturnType<typeof recordsTable>;

function buildInsert(
  workspace: string,
  table: Table,
  parsed: ParsedValue[],
  system: Record<string, unknown>,
  targets?: Map<string, RecordsTable>,
) {
  const row = {
    ...Object.fromEntries(parsed.map(({ column, value }) => [column.columnName, value])),
    ...system,
  } as Record<string, string>;
  const names = Object.keys(row);
  const key = names.join("\0");
  let target = targets?.get(key);
  if (!target) {
    target = recordsTable(workspace, table, names);
    targets?.set(key, target);
  }
  return { target, query: db.insert(target).values(row) };
}

export function buildRecordInserts(
  workspace: string,
  table: Table,
  rows: ParsedValue[][],
  userId: string,
  ids?: number[],
) {
  const targets = new Map<string, RecordsTable>();
  return rows.map((parsed, index) => {
    const { target, query } = buildInsert(
      workspace,
      table,
      parsed,
      { ...(ids ? { id: ids[index] } : {}), created_by: userId, updated_by: userId },
      targets,
    );
    return query.returning({ id: target.id });
  });
}

export async function createRecordRows(
  workspace: string,
  table: Table,
  rows: ParsedValue<Column>[][],
  userId: string,
) {
  const results = (await db.batch(
    buildRecordInserts(workspace, table, rows, userId) as unknown as Parameters<typeof db.batch>[0],
  )) as unknown as { id: number }[][];
  return results.flat().map((row) => Number(row.id));
}

export async function findRecordsForResponse(
  workspace: string,
  table: Table,
  ids: number[],
  options: { deleted?: boolean } = {},
) {
  const state = options.deleted ? sql`"deleted_at" is not null` : sql`"deleted_at" is null`;
  const rows: Row[] = [];
  for (let index = 0; index < ids.length; index += CHUNK)
    rows.push(
      ...(await db.all<Row>(
        sql`select ${syncSelectList} from ${physical(workspace, table)} where ${state} and "id" in (${idList(ids.slice(index, index + CHUNK))}) order by "id"`,
      )),
    );
  return rows;
}

export async function updateRecordRow(
  workspace: string,
  table: Table,
  recordId: number,
  parsed: ParsedValue<Column>[],
  userId: string,
  ownerId?: string,
) {
  const assignments = parsed.map(
    ({ column, value }) => sql`${raw(quoteIdent(column.columnName))} = ${value}`,
  );
  assignments.push(sql`"updated_at" = ${NOW}`, sql`"updated_by" = ${userId}`);

  const updated = await db.all(
    sql`update ${physical(workspace, table)} set ${sql.join(assignments, sql`, `)} where "id" = ${recordId} and "deleted_at" is null ${ownerId ? sql`and "created_by" = ${ownerId}` : sql``} returning *`,
  );
  return updated[0] as Row | undefined;
}

export async function countRecordsUpTo(
  workspace: string,
  table: Table,
  limit: number,
  ownerId?: string,
) {
  const owner = ownerId ? sql`and "created_by" = ${ownerId}` : sql``;
  const [row] = await db.all<{ n: number }>(
    sql`select count(*) as n from (select 1 from ${physical(workspace, table)} where "deleted_at" is null ${owner} limit ${limit})`,
  );
  return Number(row?.n ?? 0);
}

export async function countOwnedRecords(
  workspace: string,
  table: Table,
  ids: number[],
  ownerId: string,
) {
  let owned = 0;
  for (const part of chunks([...new Set(ids)], CHUNK)) {
    const [row] = await db.all<{ n: number }>(
      sql`select count(*) as n from ${physical(workspace, table)} where "created_by" = ${ownerId} and "id" in (${idList(part)})`,
    );
    owned += Number(row?.n ?? 0);
  }
  return owned;
}

export async function listReferencingColumns(tableId: number) {
  const rows = await db
    .select({ column: columnTable, table: tableTable })
    .from(columnTable)
    .innerJoin(tableTable, eq(tableTable.id, columnTable.tableId))
    .where(
      and(
        eq(columnTable.format, "relation"),
        isNull(columnTable.deletedAt),
        isNull(tableTable.deletedAt),
      ),
    );
  return rows.filter(
    ({ column }) => Number((column.options as { tableId?: number }).tableId) === tableId,
  );
}

export async function findLinkedIds(
  workspace: string,
  source: Table,
  column: Column,
  ids: unknown[],
) {
  const linked: number[] = [];
  await ensureRecordSchema(workspace, source);
  for (const part of chunks(ids, CHUNK))
    linked.push(
      ...(
        await db.all<{ id: number }>(
          sql`select "id" from ${physical(workspace, source)} where ${raw(quoteIdent(column.columnName))} in (${idList(part)}) and "deleted_at" is null`,
        )
      ).map((row) => row.id),
    );
  return linked;
}

export type DeletionStep = { table: Table; ids: number[] };
export type ClearStep = { table: Table; column: Column; ids: number[] };

export function buildSoftDeletes(
  workspace: string,
  deletions: DeletionStep[],
  clears: ClearStep[],
  userId: string,
) {
  return [
    ...deletions.flatMap(({ table, ids }) => {
      const target = recordsTable(workspace, table, [
        "deleted_at",
        "updated_at",
        "deleted_by",
        "updated_by",
      ]);
      return chunks(ids, CHUNK).map((part) =>
        db
          .update(target)
          .set({
            deleted_at: sql`${NOW}`,
            updated_at: sql`${NOW}`,
            deleted_by: userId,
            updated_by: userId,
          })
          .where(and(inArray(target.id, part as unknown as string[]), isNull(target.deleted_at))),
      );
    }),
    ...clears.flatMap(({ table, column, ids }) => {
      const target = recordsTable(workspace, table, [
        column.columnName,
        "updated_at",
        "updated_by",
        "deleted_at",
      ]);
      return chunks(ids, CHUNK).map((part) =>
        db
          .update(target)
          .set({ [column.columnName]: null, updated_at: sql`${NOW}`, updated_by: userId })
          .where(and(inArray(target.id, part as unknown as string[]), isNull(target.deleted_at))),
      );
    }),
  ];
}

export async function restoreRecordRow(
  workspace: string,
  table: Table,
  recordId: number,
  parsed: ParsedValue<Column>[],
  userId: string,
) {
  const assignments = parsed.map(
    ({ column, value }) => sql`${raw(quoteIdent(column.columnName))} = ${value}`,
  );
  assignments.push(
    sql`"deleted_at" = null`,
    sql`"deleted_by" = null`,
    sql`"updated_at" = ${NOW}`,
    sql`"updated_by" = ${userId}`,
  );
  const restored = await db.all(
    sql`update ${physical(workspace, table)} set ${sql.join(assignments, sql`, `)} where "id" = ${recordId} and "deleted_at" is not null returning *`,
  );
  return restored[0] as Row | undefined;
}

export async function findTrashedRecord(
  workspace: string,
  table: Table,
  columns: Column[],
  recordId: number,
) {
  const [row] = await db.all<Row>(
    sql`select ${selectList(columns)}, "deleted_at", "deleted_by" from ${physical(workspace, table)} where "id" = ${recordId} and "deleted_at" is not null limit 1`,
  );
  return row;
}

export async function listTrash(workspace: string, table: Table, query: TrashQuery) {
  const [title] = table.titleColumnId
    ? await db
        .select({ columnName: columnTable.columnName })
        .from(columnTable)
        .where(and(eq(columnTable.id, table.titleColumnId), isNull(columnTable.deletedAt)))
        .limit(1)
    : [];

  const source = physical(workspace, table);
  const titleText = title ? sql`cast(t.${raw(quoteIdent(title.columnName))} as text)` : sql`null`;
  const pattern = query.q ? `%${query.q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;
  const where: Fragment[] = [sql`t."deleted_at" is not null`];
  if (pattern)
    where.push(
      sql`(${titleText} like ${pattern} escape '\\' or cast(t."id" as text) like ${pattern} escape '\\')`,
    );
  const condition = sql.join(where, sql` and `);
  const direction = raw(query.order === "desc" ? "desc" : "asc");
  const order =
    query.sort === "name"
      ? sql`lower(${titleText}) ${direction}, t."id" asc`
      : sql`t."deleted_at" ${direction}, t."id" asc`;

  const rows = await db.all<{
    id: number;
    title: string | null;
    deleted_at: number;
    deleted_by: string | null;
    deleted_by_name: string | null;
  }>(
    sql`select t."id" as "id", ${titleText} as "title", t."deleted_at" as "deleted_at", t."deleted_by" as "deleted_by", (select u."name" from "user" u where u."id" = t."deleted_by") as "deleted_by_name" from ${source} t where ${condition} order by ${order} limit ${query.pageSize} offset ${(query.page - 1) * query.pageSize}`,
  );
  const [{ total }] = await db.all<{ total: number }>(
    sql`select count(*) as total from ${source} t where ${condition}`,
  );

  return {
    rows: rows.map((row) => ({
      id: row.id,
      title: row.title,
      deletedAt: Number(row.deleted_at),
      deletedBy: row.deleted_by ? { id: row.deleted_by, label: row.deleted_by_name } : null,
    })),
    total: Number(total),
  };
}

export async function findTrashLabels(workspace: string, columns: Column[], row: Row) {
  const labels: Row = {};

  for (const column of columns) {
    const value = row[column.columnName];
    if (column.format !== "relation" || value === null || value === undefined) continue;
    const [target] = await db
      .select({ tableName: tableTable.tableName, title: columnTable.columnName })
      .from(tableTable)
      .leftJoin(columnTable, eq(columnTable.id, tableTable.titleColumnId))
      .where(
        and(
          eq(tableTable.id, Number((column.options as { tableId?: number }).tableId)),
          isNull(tableTable.deletedAt),
        ),
      )
      .limit(1);
    if (!target) continue;
    const [found] = await db.all<{ label: string | null }>(
      sql`select cast(${raw(quoteIdent(target.title ?? "id"))} as text) as label from ${raw(quoteIdent(physicalTableName(workspace, target.tableName)))} where "id" = ${value} limit 1`,
    );
    if (found) labels[`${column.columnName}__label`] = found.label;
  }

  for (const key of ["created_by", "updated_by"]) {
    if (!row[key]) continue;
    const [user] = await db.all<{ name: string }>(
      sql`select "name" from "user" where "id" = ${row[key]} limit 1`,
    );
    if (user) labels[`${key}__label`] = user.name;
  }

  return labels;
}

export async function purgeExpiredRecords(workspace: string, cutoff: Date) {
  const tables = await db.select().from(tableTable).where(isNull(tableTable.deletedAt));
  let purged = 0;
  let pending = tables;
  for (let pass = 0; pass < 3 && pending.length; pass++) {
    const failed: typeof tables = [];
    for (const table of pending) {
      try {
        await ensureRecordSchema(workspace, table);
        const removed = await db.all<{ id: number }>(
          sql`delete from ${physical(workspace, table)} where "deleted_at" is not null and "deleted_at" < ${cutoff.getTime()} returning "id"`,
        );
        purged += removed.length;
      } catch {
        failed.push(table);
      }
    }
    pending = failed;
  }
  return purged;
}
