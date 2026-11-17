import { z } from "zod";

export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return undefined;
  if (value === "/" || value.startsWith("/auth")) return undefined;
  return value;
}

export const authSearchSchema = z.object({
  redirect: z
    .unknown()
    .transform((value) => safeRedirect(value))
    .optional(),
});
