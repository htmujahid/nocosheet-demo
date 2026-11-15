import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listDeletedForms } from "@/lib/forms/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (_c, { params }) => ({
  rows: await listDeletedForms(params.table),
}));
