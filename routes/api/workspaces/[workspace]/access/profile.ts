import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { findUserProfile } from "@/lib/access/repository";
import { isAdmin } from "@/lib/auth/access";

export const GET = defineHandler(async (c) => {
  const user = requireAuth(c);
  return { profile: isAdmin(user) ? null : ((await findUserProfile(user.id)) ?? null) };
});
