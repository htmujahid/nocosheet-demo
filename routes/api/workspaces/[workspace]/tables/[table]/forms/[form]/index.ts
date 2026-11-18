import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteForms, findForm, updateForm } from "@/lib/forms/repository";
import { checkFormDefinition, formInputSchema } from "@/lib/forms/validation";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { requireAccess } from "@/lib/access/require-access";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  form: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await requireAccess(c, "create", params.table, params.form);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const form = await findForm(table.id, params.form);
  if (!form || (!isAdmin(user) && !form.isOpen)) throw httpError(404, NOT_FOUND);

  const columns = (await listColumns(table.id)).filter((column) =>
    form.selectColumns.includes(column.columnName),
  );
  return {
    ...form,
    table: { id: table.id, name: table.name, titleColumnId: table.titleColumnId },
    columns,
  };
});

export const PATCH = defineHandler.withValidator({ params, body: formInputSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  if (!(await findForm(table.id, params.form))) throw httpError(404, NOT_FOUND);

  const problem = checkFormDefinition(await listColumns(table.id), body);
  if (problem) throw httpError(400, problem);

  try {
    return await updateForm(params.form, body);
  } catch (error) {
    conflictOrBadRequest(error, "A form with this name already exists.");
  }
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  if (!(await findForm(params.table, params.form))) throw httpError(404, NOT_FOUND);
  await deleteForms([params.form]);
  return { ok: true };
});
