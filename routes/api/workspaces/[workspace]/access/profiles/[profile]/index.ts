import { defineHandler } from "void";
import { z } from "zod";

import { assertGrantable } from "@/lib/access/guard";
import {
  countProfileMembers,
  deleteProfile,
  findProfile,
  findProfileByName,
  findProfileWithGrants,
  makeDefaultProfile,
  replaceGrants,
  updateProfile,
} from "@/lib/access/repository";
import { profileUpdateSchema } from "@/lib/access/validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";

const params = z.object({ workspace: z.string(), profile: z.coerce.number().int().positive() });

const NOT_FOUND = "Access profile not found.";

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  const profile = await findProfileWithGrants(params.profile);
  if (!profile) throw httpError(404, NOT_FOUND);
  return profile;
});

export const PATCH = defineHandler.withValidator({ params, body: profileUpdateSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const profile = await findProfile(params.profile);
  if (!profile) throw httpError(404, NOT_FOUND);

  if (body.name !== undefined && body.name !== profile.name) {
    if (profile.isSystem) throw httpError(400, "Built-in access profiles can't be renamed.");
    const existing = await findProfileByName(body.name);
    if (existing && existing.id !== profile.id)
      throw httpError(409, `An access profile named "${body.name}" already exists.`);
  }
  if (profile.kind !== "custom" && body.isDefault)
    throw httpError(400, `The ${profile.name} profile can't be the default.`);
  if (body.isDefault === false && profile.isDefault)
    throw httpError(400, "Make another profile the default instead.");

  if (body.grants) await assertGrantable(body.grants);

  try {
    if (body.name !== undefined || body.description !== undefined)
      await updateProfile(profile.id, { name: body.name, description: body.description });
    if (body.grants) await replaceGrants(profile.id, body.grants);
    if (body.isDefault) await makeDefaultProfile(profile.id);
  } catch (error) {
    conflictOrBadRequest(error, `An access profile named "${body.name}" already exists.`);
  }

  return findProfileWithGrants(profile.id);
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  requireAdmin(c);
  const profile = await findProfile(params.profile);
  if (!profile) throw httpError(404, NOT_FOUND);
  if (profile.isSystem) throw httpError(400, "Built-in access profiles can't be deleted.");
  if (profile.isDefault)
    throw httpError(400, "This is the default profile. Make another profile the default first.");

  const members = await countProfileMembers(profile.id);
  if (members > 0)
    throw httpError(
      409,
      `${members} ${members === 1 ? "member has" : "members have"} this profile. Give them another profile first.`,
    );

  try {
    await deleteProfile(profile.id);
  } catch (error) {
    conflictOrBadRequest(error, "This profile is still assigned to members.");
  }
  return { ok: true };
});
