import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { listFavorites } from "@/lib/tables/repository";

export const GET = defineHandler(async (c) => listFavorites(requireAuth(c).id));
