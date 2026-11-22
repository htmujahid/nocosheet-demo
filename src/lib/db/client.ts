import { DbClient } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";

import { clearOffline, clearOfflineScope } from "./offline";
import { clearPersistence, clearPersistenceScope, openPersistence } from "./persistence";

const clients = new Map<string, Promise<DbClient>>();

export function openDbClient(userId: string, workspace: string, queryClient: QueryClient) {
  const key = `${userId}:${workspace}`;
  let client = clients.get(key);
  if (!client) {
    client = openPersistence(userId, workspace).then(
      (handle) => new DbClient({ queryClient, persistence: handle?.persistence }),
    );
    clients.set(key, client);
  }
  return client;
}

export async function resetDbClient(userId: string, workspace: string) {
  const key = `${userId}:${workspace}`;
  const pending = clients.get(key);
  clients.delete(key);
  const client = await pending;
  await clearOfflineScope(userId, workspace);
  await client?.cleanup().catch(() => undefined);
  await clearPersistenceScope(userId, workspace);
}

export async function clearDbClients() {
  const open = await Promise.all(clients.values());
  clients.clear();
  await clearOffline();
  await Promise.all(open.map((client) => client.cleanup().catch(() => undefined)));
  await clearPersistence();
}
