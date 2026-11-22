import { useLiveQuery } from "@tanstack/react-db";

import { configCollection } from "@/data/config";

export function useConfig() {
  const { data } = useLiveQuery({
    query: (q) => q.from({ config: configCollection }).findOne(),
  });
  return data ?? null;
}
