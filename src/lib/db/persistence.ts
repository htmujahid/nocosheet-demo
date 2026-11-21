import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
} from "@tanstack/browser-db-sqlite-persistence";

type Handle = {
  persistence: ReturnType<typeof createBrowserWASQLitePersistence>;
  close: () => Promise<void>;
};

const OPEN_TIMEOUT_MS = 20_000;
const FILE_PREFIX = "nocosheet-";

const opening = new Map<string, Promise<Handle | null>>();
const swept = new Map<string, Promise<void>>();

const scopeKey = (userId: string, workspace: string) => `${userId}:${workspace}`;

async function shortHash(text: string, length: number) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

const userPrefix = async (userId: string) => `${FILE_PREFIX}${await shortHash(userId, 12)}-`;
const databaseName = async (userId: string, workspace: string) =>
  `${await userPrefix(userId)}${await shortHash(workspace, 8)}.sqlite`;

async function open(userId: string, workspace: string): Promise<Handle> {
  const database = await openBrowserWASQLiteOPFSDatabase({
    databaseName: await databaseName(userId, workspace),
    timeoutMs: OPEN_TIMEOUT_MS,
  });
  const coordinator = new BrowserCollectionCoordinator({
    dbName: `${FILE_PREFIX}${userId}-${workspace}`,
  });
  const persistence = createBrowserWASQLitePersistence({ database, coordinator });

  return {
    persistence,
    close: async () => {
      coordinator.dispose();
      await database.close?.();
    },
  };
}

type DirectoryEntries = { values(): AsyncIterable<{ name: string }> };

async function removeFiles(matches: (name: string) => boolean) {
  try {
    const root = await navigator.storage.getDirectory();
    for await (const entry of (root as unknown as DirectoryEntries).values()) {
      if (!matches(entry.name)) continue;
      await root.removeEntry(entry.name, { recursive: true }).catch(() => undefined);
    }
  } catch {
    return;
  }
}

async function closeScopes(matches: (key: string) => boolean) {
  const keys = [...opening.keys()].filter(matches);
  const closing = await Promise.all(keys.map((key) => opening.get(key)));
  for (const key of keys) opening.delete(key);
  await Promise.all(closing.map((handle) => handle?.close().catch(() => undefined)));
}

function removeOtherUsers(userId: string) {
  let pending = swept.get(userId);
  if (!pending) {
    pending = (async () => {
      await closeScopes((key) => !key.startsWith(`${userId}:`));
      const own = await userPrefix(userId);
      await removeFiles((name) => name.startsWith(FILE_PREFIX) && !name.startsWith(own));
    })();
    swept.set(userId, pending);
  }
  return pending;
}

export function openPersistence(userId: string, workspace: string) {
  const key = scopeKey(userId, workspace);
  let pending = opening.get(key);
  if (!pending) {
    pending = removeOtherUsers(userId)
      .then(() => open(userId, workspace))
      .catch((error) => {
        console.warn("The local database could not be opened; continuing without it.", error);
        return null;
      });
    opening.set(key, pending);
  }
  return pending;
}

export async function clearPersistenceScope(userId: string, workspace: string) {
  const key = scopeKey(userId, workspace);
  const pending = opening.get(key);
  opening.delete(key);
  const handle = await pending;
  await handle?.close().catch(() => undefined);
  const name = await databaseName(userId, workspace);
  await removeFiles((file) => file.startsWith(name));
}

export async function clearPersistence() {
  swept.clear();
  await closeScopes(() => true);
  await removeFiles((name) => name.startsWith(FILE_PREFIX));
}
