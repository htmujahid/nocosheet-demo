import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { storage } from "void/storage";

import { AVATAR_MAX_BYTES, AVATAR_TYPES, avatarKey, avatarUrl } from "@/lib/avatar";
import { httpError } from "@/lib/http";

const USER_ID_PATTERN = /^[\w-]+$/;

export const GET = defineHandler(async (c) => {
  const id = c.req.query("id");
  if (!id || !USER_ID_PATTERN.test(id)) return c.notFound();

  const object = await storage.get(avatarKey(id));
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set(
    "Cache-Control",
    c.req.query("v") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Disposition", "attachment");

  return new Response(object.body, { headers });
});

export const POST = defineHandler(async (c) => {
  const user = requireAuth(c);
  const file = (await c.req.formData()).get("file");

  if (!(file instanceof File)) throw httpError(400, "Missing file");
  if (!AVATAR_TYPES.includes(file.type)) throw httpError(415, "Use a PNG, JPEG, WebP or GIF image");
  if (file.size > AVATAR_MAX_BYTES) throw httpError(413, "Image must be 2 MB or smaller");

  await storage.put(avatarKey(user.id), file, { httpMetadata: { contentType: file.type } });

  return c.json({ url: avatarUrl(user.id, Date.now()) });
});

export const DELETE = defineHandler(async (c) => {
  const user = requireAuth(c);
  await storage.delete(avatarKey(user.id));
  return c.json({ ok: true });
});
