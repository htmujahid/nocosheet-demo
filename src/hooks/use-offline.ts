import { useRouteContext } from "@tanstack/react-router";

export function useOffline() {
  return useRouteContext({ from: "/workspaces/$workspace", select: (context) => context.offline });
}
