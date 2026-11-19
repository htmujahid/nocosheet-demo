import { defineHandler } from "void";
import { env } from "void/env";

import { googleCredentials } from "@/lib/auth/google";

// Public, non-sensitive runtime config for the client (what is configured on this deployment).
export const GET = defineHandler(async () => ({
  auth: {
    google: googleCredentials(env) !== undefined,
  },
}));
