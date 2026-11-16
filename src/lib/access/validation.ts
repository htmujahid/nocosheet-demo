import { z } from "zod";

import { actionOf, GRANTS } from "./grants";

export const grantSchema = z.object({
  resourceId: z.number().int().positive().nullable(),
  grant: z.enum(GRANTS),
});

const grantsSchema = z
  .array(grantSchema)
  .max(500)
  .refine((grants) => {
    const seen = new Set<string>();
    for (const entry of grants) {
      const key = `${entry.resourceId ?? 0}:${actionOf(entry.grant)}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  }, "Each action can only be set once per table");

const profileName = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(64, "Name must be 64 characters or fewer");

const profileDescription = z
  .string()
  .trim()
  .max(300, "Description must be 300 characters or fewer")
  .nullable()
  .optional();

export const profileCreateSchema = z.object({
  name: profileName,
  description: profileDescription,
  grants: grantsSchema.default([]),
});

export const profileUpdateSchema = z.object({
  name: profileName.optional(),
  description: profileDescription,
  isDefault: z.boolean().optional(),
  grants: grantsSchema.optional(),
});

export const profileAssignSchema = z.object({
  userId: z.string().min(1).max(64),
  profileId: z.number().int().positive(),
});

export type ProfileCreateInput = z.input<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;
