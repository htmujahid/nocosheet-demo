import { defineHandler } from "void";
import { z } from "zod";

import { deleteApiKey, findUserApiKey } from "@/lib/api-keys/repository";
import { findUserById } from "@/lib/auth/repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireSession } from "@/lib/auth/require-session";
import { httpError } from "@/lib/http";

const params = z.object({
  workspace: z.string(),
  member: z.string().min(1).max(64),
  key: z.string().min(1).max(64),
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireSession(c);
  requireAdmin(c);
  if (!(await findUserById(params.member))) throw httpError(404, "Member not found.");
  const key = await findUserApiKey(params.member, params.key);
  if (!key) throw httpError(404, "API key not found.");
  await deleteApiKey(key.id);
  return { ok: true };
});
