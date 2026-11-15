import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { findForm } from "@/lib/forms/repository";
import { httpError, NOT_FOUND, writeFailure } from "@/lib/http";
import { checkLinks } from "@/lib/records/links";
import { createRecordRow } from "@/lib/records/repository";
import { findMissingRequired, parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { requireAccess } from "@/lib/roles/require-access";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  form: z.coerce.number().int().positive(),
});

export const POST = defineHandler.withValidator({ params, body: recordPatchSchema })(async (
  c,
  { params, body },
) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  await requireAccess(c, "create", params.table, params.form);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const form = await findForm(table.id, params.form);
  if (!form) throw httpError(404, NOT_FOUND);
  if (!form.isOpen) throw httpError(403, "This form isn't accepting responses.");

  const stray = Object.keys(body.values).find((key) => !form.selectColumns.includes(key));
  if (stray) throw httpError(400, `"${stray}" isn't part of this form.`);

  const columns = await listColumns(table.id);
  const parsed = parseRecordValues(columns, body.values);
  if (!parsed.ok) throw httpError(400, parsed.message, parsed.field);

  const broken = await checkLinks(workspace, parsed.values);
  if (broken) throw httpError(400, broken.message, broken.field);

  const missing = findMissingRequired(columns, parsed.values);
  if (missing) throw httpError(400, `${missing.name}: This field is required`, missing.columnName);

  try {
    const created = await createRecordRow(workspace, table, parsed.values, user.id);
    if (!created) throw httpError(400, "The response could not be saved.");
    return { id: created.id };
  } catch (error) {
    writeFailure(error, columns);
  }
});
