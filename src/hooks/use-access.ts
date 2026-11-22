import { useMemo } from "react";

import { useLiveQuery, useLiveSuspenseQuery } from "@tanstack/react-db";

import { grantsCollection } from "@/data/workspace/access";
import { profileCollection } from "@/data/workspace/profile";
import { type Action, scopeFor, type Scope } from "@/lib/access/grants";
import { isAdmin } from "@/lib/auth/access";

import { useSession } from "./use-session";

export function useAccess() {
  const session = useSession();
  const { data: grants } = useLiveSuspenseQuery((q) => q.from({ grant: grantsCollection }));
  const { data: stored } = useLiveQuery((q) => q.from({ profile: profileCollection }).findOne());
  const userId = session?.user.id;
  const admin = isAdmin({ role: (session?.user as { role?: string | null } | undefined)?.role });
  const profile = stored && stored.userId === userId ? stored.profile : null;

  return useMemo(() => {
    const access = { admin, grants };
    const scope = (tableId: number, action: Action): Scope => scopeFor(access, tableId, action);

    return {
      admin,
      profile,
      grants,
      scope,
      can: (tableId: number, action: Action) => scope(tableId, action) !== "none",
      canOn: (tableId: number, action: Action, ownerId: string | null | undefined) => {
        const level = scope(tableId, action);
        return level === "all" || (level === "own" && !!userId && ownerId === userId);
      },
    };
  }, [admin, grants, profile, userId]);
}
