import { defineHandler } from "void";

import { assertGrantable } from "@/lib/access/guard";
import {
  createProfile,
  findProfileByName,
  findProfileWithGrants,
  listProfilesWithGrants,
  replaceGrants,
} from "@/lib/access/repository";
import { profileCreateSchema } from "@/lib/access/validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";

export const GET = defineHandler(async (c) => {
  requireAdmin(c);
  return listProfilesWithGrants();
});

export const POST = defineHandler.withValidator({ body: profileCreateSchema })(async (
  c,
  { body },
) => {
  requireAdmin(c);
  if (await findProfileByName(body.name))
    throw httpError(409, `An access profile named "${body.name}" already exists.`);

  await assertGrantable(body.grants);

  const profile = await createProfile({ name: body.name, description: body.description });
  if (body.grants.length > 0) await replaceGrants(profile.id, body.grants);
  return findProfileWithGrants(profile.id);
});
