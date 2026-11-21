import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { assignProfile, findProfile, listAssignments } from "@/lib/access/repository";
import { profileAssignSchema } from "@/lib/access/validation";
import { isAdmin } from "@/lib/auth/access";
import { findUserById } from "@/lib/auth/repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";

export const GET = defineHandler(async (c) => {
  requireAdmin(c);
  return listAssignments();
});

export const PUT = defineHandler.withValidator({ body: profileAssignSchema })(async (
  c,
  { body },
) => {
  requireAdmin(c);
  const member = await findUserById(body.userId);
  if (!member) throw httpError(404, "Member not found.");
  if (isAdmin(member))
    throw httpError(400, "Administrators have full access. Access profiles apply to members only.");

  const profile = await findProfile(body.profileId);
  if (!profile) throw httpError(404, "Access profile not found.");

  if (profile.kind !== "custom")
    throw httpError(400, `The ${profile.name} profile can't be assigned.`);

  await assignProfile(member.id, profile.id, requireAuth(c).id);
  return { userId: member.id, profileId: profile.id };
});
