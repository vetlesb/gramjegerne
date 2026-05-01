// Gramjegerne service worker
// Bump CACHE_VERSION to invalidate all caches.
const CACHE_VERSION = 'v1';
const CACHES = {
  pages: `pages-${CACHE_VERSION}`,
  apiMaps: `api-maps-${CACHE_VERSION}`,
  sanityImages: `sanity-images-${CACHE_VERSION}`,
  staticResources: `static-resources-${CACHE_VERSION}`,
  fonts: `fonts-${CACHE_VERSION}`,
};
const ALL_CACHE_NAMES = Object.values(CACHES);

const TILE_HOST_PATTERNS = [
  /^https:\/\/cache\.kartverket\.no\//i,
  /^https:\/\/[a-z0-9.]*\.tile\.openstreetmap\.org\//i,
  /^https:\/\/[a-z0-9.]*\.tile\.opentopomap\.org\//i,
  /^https:\/\/server\.arcgisonline\.com\//i,
];

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => !ALL_CACHE_NAMES.includes(name)).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const {request} = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Tile hosts: never intercept — leaflet.offline (added in step 2) owns this path.
  if (TILE_HOST_PATTERNS.some((re) => re.test(request.url))) return;

  // Sanity image CDN: stale-while-revalidate.
  if (url.hostname === 'cdn.sanity.io' && url.pathname.startsWith('/images/')) {
    event.respondWith(staleWhileRevalidate(request, CACHES.sanityImages, 200));
    return;
  }

  if (!sameOrigin) return;

  // Map data API: stale-while-revalidate so a previously-loaded trip renders offline.
  if (url.pathname.startsWith('/api/getMaps') || url.pathname.startsWith('/api/maps/')) {
    event.respondWith(staleWhileRevalidate(request, CACHES.apiMaps, 100));
    return;
  }

  // Skip all other API routes (auth-sensitive, write-heavy).
  if (url.pathname.startsWith('/api/')) return;

  // Page navigations: NetworkFirst with a short timeout, fall back to cache.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHES.pages, 5000));
    return;
  }

  // Same-origin fonts: cache-first (immutable).
  if (request.destination === 'font') {
    event.respondWith(cacheFirst(request, CACHES.fonts));
    return;
  }

  // Same-origin scripts/styles/images: stale-while-revalidate.
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image'
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHES.staticResources, 150));
    return;
  }
});

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetchWithTimeout(request, timeoutMs);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('offline and no cached response');
  }
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).then(() => trimCache(cacheName, maxEntries));
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await networkPromise) || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('network timeout')), timeoutMs);
    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function trimCache(cacheName, maxEntries) {
  if (!maxEntries) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}
