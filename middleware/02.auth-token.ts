import { defineMiddleware } from "void";

import { AUTH_TOKEN_RESPONSE_HEADER, clientReceivesAuthToken } from "@/lib/auth/bearer";

export default defineMiddleware(async (c, next) => {
  await next();
  if (!c.req.path.startsWith("/api/auth/")) return;
  if (!c.res.headers.has(AUTH_TOKEN_RESPONSE_HEADER)) return;
  if (clientReceivesAuthToken(c.req.raw.headers)) return;
  c.header(AUTH_TOKEN_RESPONSE_HEADER, undefined);
});
