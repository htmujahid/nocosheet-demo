import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { resolveFormsQuery, formsSearchSchema } from "@/lib/forms/query";
import { createForm, findForms, listFormsPage, softDeleteForms } from "@/lib/forms/repository";
import { checkFormDefinition, formInputSchema, formsDeleteSchema } from "@/lib/forms/validation";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { authorize } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: formsSearchSchema })(async (
  c,
  { params, query },
) => {
  const user = requireAuth(c);
  await authorize(user, "create", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  return listFormsPage(table.id, resolveFormsQuery(query), !isAdmin(user));
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: formInputSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");

    const problem = checkFormDefinition(await listColumns(table.id), body);
    if (problem) throw httpError(400, problem);

    try {
      return await createForm(table, body, requireAuth(c).id);
    } catch (error) {
      conflictOrBadRequest(error, "A form with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: formsDeleteSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");

    const ids = [...new Set(body.ids)];
    if ((await findForms(table.id, ids)).length !== ids.length)
      throw httpError(404, "Form not found.");

    await softDeleteForms(ids, requireAuth(c).id);
    return { ok: true };
  }),
);
