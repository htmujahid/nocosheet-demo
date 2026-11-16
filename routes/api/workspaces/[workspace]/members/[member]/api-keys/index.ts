import { defineHandler } from "void";
import { z } from "zod";

import { listUserApiKeys } from "@/lib/api-keys/repository";
import { findUserById } from "@/lib/auth/repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireSession } from "@/lib/auth/require-session";
import { httpError } from "@/lib/http";

const params = z.object({ workspace: z.string(), member: z.string().min(1).max(64) });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireSession(c);
  requireAdmin(c);
  if (!(await findUserById(params.member))) throw httpError(404, "Member not found.");
  return listUserApiKeys(params.member);
});
