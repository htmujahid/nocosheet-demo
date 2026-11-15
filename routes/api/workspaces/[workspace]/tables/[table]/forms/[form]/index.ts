import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/access";
import { requireAdmin } from "@/lib/auth/require-admin";
import { findForm, softDeleteForm, updateForm } from "@/lib/forms/repository";
import { checkFormDefinition, formInputSchema } from "@/lib/forms/validation";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { authorize } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  form: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await authorize(user, "create", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const form = await findForm(table.id, params.form);
  if (!form || (!isAdmin(user) && !form.isOpen)) throw httpError(404, "Form not found.");

  const columns = (await listColumns(table.id)).filter((column) =>
    form.selectColumns.includes(column.columnName),
  );
  return {
    ...form,
    table: { id: table.id, name: table.name, titleColumnId: table.titleColumnId },
    columns,
  };
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: formInputSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");
    if (!(await findForm(table.id, params.form))) throw httpError(404, "Form not found.");

    const problem = checkFormDefinition(await listColumns(table.id), body);
    if (problem) throw httpError(400, problem);

    try {
      return await updateForm(params.form, body);
    } catch (error) {
      conflictOrBadRequest(error, "A form with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    if (!(await findForm(params.table, params.form))) throw httpError(404, "Form not found.");
    await softDeleteForm(params.form, requireAuth(c).id);
    return { ok: true };
  }),
);
