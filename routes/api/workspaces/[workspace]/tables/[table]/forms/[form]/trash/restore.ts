import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { findDeletedForm, restoreForm } from "@/lib/forms/repository";
import { conflictOrBadRequest, httpError } from "@/lib/http";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  form: z.coerce.number().int().positive(),
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => {
    const form = await findDeletedForm(params.table, params.form);
    if (!form) throw httpError(404, "This form isn't in the trash.");

    try {
      await restoreForm(form.id);
    } catch (error) {
      conflictOrBadRequest(error, `A form named "${form.name}" already exists.`);
    }
    return { id: form.id };
  }),
);
