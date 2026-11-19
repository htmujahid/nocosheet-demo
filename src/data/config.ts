import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

export const configQueryOptions = queryOptions({
  queryKey: ["config"] as const,
  queryFn: () => fetch("/api/config"),
  staleTime: Infinity,
});
