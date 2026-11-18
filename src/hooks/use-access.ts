import { useMemo } from "react";

import { useRouteContext } from "@tanstack/react-router";

import { type Action, scopeFor, type Scope } from "@/lib/access/grants";

import { useSession } from "./use-session";

export function useAccess() {
  const session = useSession();
  const data = useRouteContext({ from: "/workspaces/$workspace", select: (context) => context.access });
  const userId = session?.user.id;

  return useMemo(() => {
    const scope = (action: Action, tableId: number, viewId?: number | null): Scope => {
      return scopeFor(data, action, tableId, viewId);
    };

    return {
      admin: data.admin,
      profile: data.profile,
      grants: data.grants,
      scope,
      can: (action: Action, tableId: number, viewId?: number | null) =>
        scope(action, tableId, viewId) !== "none",
      canOn: (
        action: Action,
        tableId: number,
        ownerId: string | null | undefined,
        viewId?: number | null,
      ) => {
        const level = scope(action, tableId, viewId);
        return level === "all" || (level === "own" && !!userId && ownerId === userId);
      },
    };
  }, [data, userId]);
}
