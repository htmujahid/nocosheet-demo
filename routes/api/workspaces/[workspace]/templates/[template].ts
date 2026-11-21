import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError, NOT_FOUND } from "@/lib/http";
import { applyTemplate } from "@/lib/templates/apply";
import { findTemplate } from "@/lib/templates/catalog";

const params = z.object({ workspace: z.string(), template: z.string() });
const body = z.object({ sampleData: z.boolean().default(false) });

export const POST = defineHandler.withValidator({ params, body })(async (c, { params, body }) => {
  requireAdmin(c);
  const template = findTemplate(params.template);
  if (!template) throw httpError(404, NOT_FOUND);

  try {
    return await applyTemplate(c.get("workspaceId"), template, requireAuth(c).id, body);
  } catch (error) {
    throw httpError(
      409,
      error instanceof Error ? error.message : "The template could not be applied.",
    );
  }
});
