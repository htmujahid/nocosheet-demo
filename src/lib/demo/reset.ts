import * as schema from "@db/schema";
import type { SeedDb, SeedExec, SeedSchema } from "@db/seed/helpers";
import { seedWorkspace } from "@db/seed/run";
import { db, sql } from "void/db";
import { storage } from "void/storage";

import { buildDropTable } from "@/lib/tables/ddl";
import { buildDropView } from "@/lib/views/ddl";

/** Statements per D1 batch. Each batch is one transaction and one subrequest. */
const BATCH_SIZE = 100;
/** R2 delete accepts up to 1000 keys per call. */
const R2_PAGE = 1000;

/**
 * Auth tables, children first. Only those that exist are emptied: sessions and verification
 * data live in KV here, but would be tables if Better Auth were configured to store them in D1.
 */
const AUTH_TABLES = ["session", "verification", "apikey", "passkey", "twoFactor", "account", "user"];

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;

/** Runs the seed's raw SQL as D1 batches. */
const batchExec: SeedExec = async (statements) => {
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const chunk = statements.slice(i, i + BATCH_SIZE).map((statement) => db.run(sql.raw(statement)));
    await db.batch(chunk as never);
  }
};

/** Drops every workspace data table and view, then empties all app and auth rows in one transaction. */
export async function wipeDatabase() {
  // `_` is a LIKE wildcard, so escape it to match the literal `default__t_` / `default__v_` prefixes.
  const objects = (await db.all(
    sql`select type, name from sqlite_master
        where (type = 'table' and name like 'default\\_\\_t\\_%' escape '\\')
           or (type = 'view' and name like 'default\\_\\_v\\_%' escape '\\')`,
  )) as { type: "table" | "view"; name: string }[];

  const existing = new Set(
    ((await db.all(sql`select name from sqlite_master where type = 'table'`)) as { name: string }[]).map(
      (row) => row.name,
    ),
  );

  const views = objects.filter((object) => object.type === "view");
  const tables = objects.filter((object) => object.type === "table");

  await db.batch([
    db.run(sql`pragma defer_foreign_keys = on`),
    ...views.map((view) => db.run(sql.raw(buildDropView(view.name)))),
    ...tables.map((table) => db.run(sql.raw(buildDropTable(table.name)))),
    db.delete(schema.auditTable),
    db.delete(schema.trashTable),
    // Cascades to tables, columns, views, forms, favourites and resource-scoped grants.
    db.delete(schema.resourceTable),
    ...AUTH_TABLES.filter((name) => existing.has(name)).map((name) => db.run(sql.raw(`delete from ${quote(name)}`))),
    // Migrations own the system profiles and their grants, so only custom profiles go.
    db.run(sql`delete from default__access_profile where is_system = 0`),
  ] as never);

  return { tables: tables.length, views: views.length };
}

/** Deletes every object in the bucket, a page at a time. */
export async function wipeStorage() {
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const page = await storage.list({ limit: R2_PAGE, cursor });
    if (page.objects.length > 0) {
      await storage.delete(page.objects.map((object) => object.key));
      deleted += page.objects.length;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}

export async function resetDemo() {
  const dropped = await wipeDatabase();
  console.log(`Dropped ${dropped.tables} data tables and ${dropped.views} views`);

  await seedWorkspace(db as unknown as SeedDb, schema as unknown as SeedSchema, batchExec);

  const objects = await wipeStorage();
  console.log(`Deleted ${objects} stored files`);
}
