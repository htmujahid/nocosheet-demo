import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import { type QueryClient, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { CURRENT, writeCurrentRow } from "@/lib/db/current-row";

const fetchConfig = () => fetch("/api/config");

export type ConfigRow = { id: string } & Awaited<ReturnType<typeof fetchConfig>>;

export const configQueryOptions = queryOptions({
  queryKey: ["config"] as const,
  queryFn: fetchConfig,
  staleTime: Infinity,
});

export const configCollection = createCollection(
  localStorageCollectionOptions<ConfigRow, string>({
    id: "config",
    storageKey: "nocosheet:config",
    getKey: (row) => row.id,
  }),
);

export async function loadConfig(queryClient: QueryClient) {
  await configCollection.preload();
  await queryClient
    .query(configQueryOptions)
    .then((config) => writeCurrentRow(configCollection, config))
    .catch(() => undefined);
  return configCollection.get(CURRENT) ?? null;
}
