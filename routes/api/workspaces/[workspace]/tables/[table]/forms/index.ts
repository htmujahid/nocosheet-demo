import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formsLimitSchema } from "@/lib/forms/query";
import {
  createForm,
  findForms,
  listForms,
  softDeleteForms,
} from "@/lib/forms/repository";
import { checkFormDefinition, formInputSchema, formsDeleteSchema } from "@/lib/forms/validation";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { visibleResources } from "@/lib/access/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: formsLimitSchema })(async (
  c,
  { params, query },
) => {
  const user = requireAuth(c);
  if (!(await findTable(params.table))) return [];
  const visible = await visibleResources(user, "create", params.table, await listForms(params.table));
  const forms = isAdmin(user) ? visible : visible.filter((form) => form.isOpen);
  return query.limit ? forms.slice(0, query.limit) : forms;
});

export const POST = defineHandler.withValidator({ params, body: formInputSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const problem = checkFormDefinition(await listColumns(table.id), body);
  if (problem) throw httpError(400, problem);

  try {
    return await createForm(table, body, requireAuth(c).id);
  } catch (error) {
    conflictOrBadRequest(error, "A form with this name already exists.");
  }
});

export const DELETE = defineHandler.withValidator({ params, body: formsDeleteSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const ids = [...new Set(body.ids)];
  if ((await findForms(table.id, ids)).length !== ids.length) throw httpError(404, NOT_FOUND);

  await softDeleteForms(ids, requireAuth(c).id);
  return { ok: true };
});
