import { useRouteContext } from "@tanstack/react-router";

export function useConfig() {
  return useRouteContext({ from: "__root__", select: (context) => context.config });
}
