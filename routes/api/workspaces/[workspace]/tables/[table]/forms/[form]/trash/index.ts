import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { findDeletedForm, purgeForm } from "@/lib/forms/repository";
import { httpError } from "@/lib/http";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  form: z.coerce.number().int().positive(),
});

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => {
    const form = await findDeletedForm(params.table, params.form);
    if (!form) throw httpError(404, "This form isn't in the trash.");
    await purgeForm(form.id);
    return { ok: true };
  }),
);
