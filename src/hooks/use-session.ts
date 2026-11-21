import { useLiveQuery } from "@tanstack/react-db";

import { sessionCollection } from "@/data/auth/session";

export function useSession() {
  const { data } = useLiveQuery({
    query: (q) => q.from({ session: sessionCollection }).findOne(),
  });
  return data ?? null;
}
