import { HTTPException } from "hono/http-exception";
import type { CloudContext } from "void";
import type { AuthUser } from "void/auth";

import { API_KEY_HEADER } from "./api-keys";

type VerifyResult = {
  valid: boolean;
  error: { code?: string; details?: { tryAgainIn?: number } } | null;
  key: { referenceId: string } | null;
};

type KeyAuth = {
  api: { verifyApiKey: (input: { body: { key: string } }) => Promise<VerifyResult> };
  $context: Promise<{
    internalAdapter: { findUserById: (id: string) => Promise<AuthUser | null> };
  }>;
};

const isBanned = (user: object) => {
  const { banned, banExpires } = user as {
    banned?: boolean | null;
    banExpires?: Date | number | null;
  };
  return Boolean(banned) && (!banExpires || new Date(banExpires).getTime() > Date.now());
};

function rateLimited(tryAgainIn: number | undefined) {
  const seconds = Math.max(1, Math.ceil((tryAgainIn ?? 1000) / 1000));
  const message = `Too many requests. Try again in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`;
  return new HTTPException(429, {
    message,
    res: Response.json({ message }, { status: 429, headers: { "Retry-After": String(seconds) } }),
  });
}

export async function authenticateApiKey(c: CloudContext): Promise<AuthUser | null> {
  const key = c.req.header(API_KEY_HEADER);
  if (!key) return null;

  const auth = c.get("__voidAuth" as never) as KeyAuth;
  const result = await auth.api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key) {
    if (result.error?.code === "RATE_LIMITED") throw rateLimited(result.error.details?.tryAgainIn);
    return null;
  }

  const { internalAdapter } = await auth.$context;
  const user = await internalAdapter.findUserById(result.key.referenceId);
  return user && !isBanned(user) ? user : null;
}
