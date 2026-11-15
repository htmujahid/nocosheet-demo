import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/access";
import { listForms } from "@/lib/forms/repository";
import { httpError } from "@/lib/http";
import { visibleResources } from "@/lib/roles/guard";
import { findTable } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const forms = await visibleResources(user, "create", table.id, await listForms(table.id));
  return isAdmin(user) ? forms : forms.filter((form) => form.isOpen);
});
