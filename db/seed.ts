import { defineSeed } from "void/seed";

import { seedWorkspace } from "./seed/run";

export default defineSeed<typeof import("./schema")>(async (context) => {
  if (context.dialect !== "sqlite")
    throw new Error("The workspace seed targets Cloudflare D1 (SQLite).");

  await seedWorkspace(context.db, context.schema);
});
