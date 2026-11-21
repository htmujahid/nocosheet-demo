const CACHE = "nocosheet-" + "__VERSION__";
const PRECACHE = "__PRECACHE__";
const PRECACHED = new Set(PRECACHE);

const CONCURRENCY = 8;

async function precache(cache) {
  const queue = [...PRECACHE];
  const failed = [];
  const worker = async () => {
    for (let path = queue.shift(); path; path = queue.shift()) {
      await cache.add(path).catch(() => failed.push(path));
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  for (const path of failed) await cache.add(path).catch(() => undefined);
  if (!(await cache.match("/", { ignoreVary: true }))) throw new Error("Shell was not cached");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then(precache));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/", { ignoreVary: true })));
    return;
  }

  if (PRECACHED.has(url.pathname)) {
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
