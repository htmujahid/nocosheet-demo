import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { storage } from "void/storage";
import { z } from "zod";

import { fileKey } from "@/lib/files";
import { httpError } from "@/lib/http";
import { authorizeAny } from "@/lib/roles/guard";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  file: z.uuid(),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  await authorizeAny(requireAuth(c), ["read", "update", "create"], params.table);
  const object = await storage.get(fileKey(params.workspace, params.table, params.file));
  if (!object) throw httpError(404, "File not found.");

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "private, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  const name = object.customMetadata?.name ?? params.file;
  headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
  return new Response(object.body, { headers });
});
