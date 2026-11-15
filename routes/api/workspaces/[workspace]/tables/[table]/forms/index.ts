import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { resolveFormsQuery, formsSearchSchema } from "@/lib/forms/query";
import {
  createForm,
  findForms,
  listForms,
  listFormsPage,
  softDeleteForms,
} from "@/lib/forms/repository";
import { checkFormDefinition, formInputSchema, formsDeleteSchema } from "@/lib/forms/validation";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { visibleResources } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: formsSearchSchema })(async (
  c,
  { params, query },
) => {
  const user = requireAuth(c);
  const visible = (await findTable(params.table))
    ? await visibleResources(user, "create", params.table, await listForms(params.table))
    : [];
  return listFormsPage(
    params.table,
    resolveFormsQuery(query),
    !isAdmin(user),
    visible.map((form) => form.id),
  );
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: formInputSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, NOT_FOUND);

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
    if (!table) throw httpError(404, NOT_FOUND);

    const ids = [...new Set(body.ids)];
    if ((await findForms(table.id, ids)).length !== ids.length)
      throw httpError(404, NOT_FOUND);

    await softDeleteForms(ids, requireAuth(c).id);
    return { ok: true };
  }),
);
