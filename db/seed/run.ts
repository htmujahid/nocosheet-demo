import { tables } from "./data";
import { cliExec, seedTable, type SeedDb, type SeedExec, type SeedSchema, type SeedState } from "./helpers";
import { SEED_PASSWORD, seedUsers, stableId } from "./users";

/**
 * Seeds users, the default workspace and its access profiles.
 * Shared by `void db seed` (db/seed.ts) and the demo reset cron (crons/demo-reset.ts).
 */
export async function seedWorkspace(db: SeedDb, schema: SeedSchema, exec: SeedExec = cliExec(db)) {
  console.log("Seeding users");
  const team = tables.find((table) => table.name === "Team Members");
  if (!team) throw new Error("The seed needs a Team Members table.");
  const users = await seedUsers(db, team.rows);

  console.log("Seeding the default workspace");
  const state: SeedState = new Map();
  for (const [position, table] of tables.entries()) {
    await seedTable(db, schema, state, table, position, users, exec);
  }

  const tableId = (name: string) => {
    const seeded = state.get(name);
    if (!seeded) throw new Error(`Unknown seeded table ${name}`);
    return seeded.id;
  };

  await db.insert(schema.favoriteTable).values([
    { userId: users.admin, tableId: tableId("Tasks") },
    { userId: users.admin, tableId: tableId("Projects") },
    { userId: users.admin, tableId: tableId("Invoices") },
    { userId: users.member, tableId: tableId("Tasks") },
    { userId: users.member, tableId: tableId("Bug Reports") },
  ]);

  const profiles = await db.select().from(schema.accessProfileTable);
  const profileId = (name: string) => {
    const profile = profiles.find((item) => item.name === name);
    if (!profile) throw new Error(`Unknown access profile ${name}`);
    return profile.id;
  };
  await db.insert(schema.accessProfileMemberTable).values([
    {
      userId: stableId("user:maya.chen@example.com"),
      profileId: profileId("Editor"),
      assignedBy: users.admin,
    },
    {
      userId: stableId("user:kai.morgan@example.com"),
      profileId: profileId("Contributor"),
      assignedBy: users.admin,
    },
  ]);

  console.log(
    `Done. Sign in as admin@example.com, member@example.com or any team member, e.g. maya.chen@example.com (password: ${SEED_PASSWORD}).`,
  );
}
