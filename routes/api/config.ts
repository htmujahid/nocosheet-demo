import { defineHandler } from "void";
import { env } from "void/env";

// Public, non-sensitive runtime config for the client (what is configured on this deployment).
export const GET = defineHandler(async () => ({
  auth: {
    google: Boolean(env.AUTH_GOOGLE_CLIENT_ID && env.AUTH_GOOGLE_CLIENT_SECRET),
  },
}));
