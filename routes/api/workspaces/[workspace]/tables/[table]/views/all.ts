import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { visibleResources } from "@/lib/roles/guard";
import { findTable } from "@/lib/tables/repository";
import { listViews } from "@/lib/views/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  if (!(await findTable(params.table))) return [];
  return visibleResources(requireAuth(c), "read", params.table, await listViews(params.table));
});
