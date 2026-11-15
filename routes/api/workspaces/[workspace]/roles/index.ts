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

export const GET = defineHandler(requireAdmin, async () => listRolesWithGrants());

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ body: roleCreateSchema })(async (_c, { body }) => {
    if (await findRoleByName(body.name))
      throw httpError(409, `A role named "${body.name}" already exists.`);

    await assertGrantable(body.grants, "custom");

    const role = await createRole({ name: body.name, description: body.description });
    if (body.grants.length > 0) await replaceGrants(role.id, body.grants);
    return findRoleWithGrants(role.id);
  }),
);
