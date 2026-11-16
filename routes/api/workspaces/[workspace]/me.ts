import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { DEFAULT_ROLE, isAdmin } from "@/lib/auth/access";

export const GET = defineHandler((c) => {
  const user = requireAuth(c);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      role: (user as { role?: string | null }).role ?? DEFAULT_ROLE,
      isAdmin: isAdmin(user),
    },
    authenticatedWith: c.get("authMethod"),
  };
});
