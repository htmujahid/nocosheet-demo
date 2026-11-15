import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/access";
import { listForms } from "@/lib/forms/repository";
import { httpError } from "@/lib/http";
import { authorize } from "@/lib/roles/guard";
import { findTable } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await authorize(user, "create", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const forms = await listForms(table.id);
  return isAdmin(user) ? forms : forms.filter((form) => form.isOpen);
});
