import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import { assertGrantable } from "@/lib/roles/guard";
import {
  createRole,
  findRoleByName,
  findRoleWithGrants,
  listRolesWithGrants,
  replaceGrants,
} from "@/lib/roles/repository";
import { roleCreateSchema } from "@/lib/roles/validation";

export const GET = defineHandler(async (c) => {
  requireAdmin(c);
  return listRolesWithGrants();
});

export const POST = defineHandler.withValidator({ body: roleCreateSchema })(async (c, { body }) => {
  requireAdmin(c);
  if (await findRoleByName(body.name))
    throw httpError(409, `A role named "${body.name}" already exists.`);

  await assertGrantable(body.grants);

  const role = await createRole({ name: body.name, description: body.description });
  if (body.grants.length > 0) await replaceGrants(role.id, body.grants);
  return findRoleWithGrants(role.id);
});
