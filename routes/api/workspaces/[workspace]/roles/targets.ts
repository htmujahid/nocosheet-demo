import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listGrantTargets } from "@/lib/roles/repository";

export const GET = defineHandler(requireAdmin, async () => listGrantTargets());
