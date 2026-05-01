// Gramjegerne service worker
// Bump CACHE_VERSION to invalidate all caches.
const CACHE_VERSION = 'v2';
// Bump on every meaningful SW change so we can verify update-on-device.
const SW_BUILD = '2026-05-02-precache-chunks';
const CACHES = {
  pages: `pages-${CACHE_VERSION}`,
  apiMaps: `api-maps-${CACHE_VERSION}`,
  sanityImages: `sanity-images-${CACHE_VERSION}`,
  staticResources: `static-resources-${CACHE_VERSION}`,
  fonts: `fonts-${CACHE_VERSION}`,
  offline: `offline-${CACHE_VERSION}`,
};
const ALL_CACHE_NAMES = Object.values(CACHES);
const OFFLINE_URL = '/offline.html';

const TILE_HOST_PATTERNS = [
  /^https:\/\/cache\.kartverket\.no\//i,
  /^https:\/\/[a-z0-9.]*\.tile\.openstreetmap\.org\//i,
  /^https:\/\/[a-z0-9.]*\.tile\.opentopomap\.org\//i,
  /^https:\/\/server\.arcgisonline\.com\//i,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const offlineCache = await caches.open(CACHES.offline);
      await offlineCache.add(new Request(OFFLINE_URL, {cache: 'reload'}));
      // One-time purge of the pages cache: prior versions of this SW cached
      // redirected (signin) responses under /, /maps, etc. Drop everything
      // and let networkFirst re-populate with real responses.
      try {
        await caches.delete(CACHES.pages);
      } catch {
        // ignore
      }
      // Precache the maps shells AND every /_next/static/ asset they
      // reference, so bundle links from the offline page render fully
      // even before the user has navigated there. Without the asset
      // precache, the browser would try to load JS chunks offline and
      // throw ChunkLoadError, crashing the page tree.
      try {
        await precacheShellWithAssets('/maps');
        await precacheShellWithAssets('/maps/_warmup');
      } catch {
        // Best-effort only; install must not fail.
      }
      await self.skipWaiting();
    })(),
  );
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    const port = event.ports && event.ports[0];
    if (port) port.postMessage({version: SW_BUILD});
  }
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
    // Don't cache redirected responses (auth bounce → signin would poison the cache).
    if (response && response.ok && !response.redirected) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    let cached = await cache.match(request, {ignoreVary: true});
    if (!cached) cached = await cache.match(request, {ignoreSearch: true, ignoreVary: true});
    if (!cached && (request.mode === 'navigate' || request.destination === 'document')) {
      // Defensive: some WebKit versions ignore the ignoreSearch option, so
      // fall back to a manual scan of cache keys with the same pathname.
      cached = await matchSamePath(cache, request);
      // Last resort: route-aware fallbacks. /maps/<id> pages all hydrate the
      // same way from URL params, so any cached /maps/<other-id> works as a
      // shell. /maps proper falls back to the overview shell.
      if (!cached) {
        const u = new URL(request.url);
        if (u.pathname.startsWith('/maps/')) {
          cached = await matchPathPrefix(cache, '/maps/');
        } else if (u.pathname === '/maps') {
          cached = await cache.match('/maps', {ignoreVary: true});
        }
      }
    }
    if (cached) return rewrapForNavigation(cached, request);
    if (request.mode === 'navigate' || request.destination === 'document') {
      const offlineCache = await caches.open(CACHES.offline);
      const offline = await offlineCache.match(OFFLINE_URL);
      if (offline) return rewrapForNavigation(offline, request);
    }
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {'Content-Type': 'text/plain; charset=UTF-8'},
    });
  }
}

async function precacheShellWithAssets(url) {
  const res = await fetch(url, {credentials: 'same-origin', cache: 'reload'});
  if (!res.ok || res.redirected) return;
  const html = await res.clone().text();
  const pagesCache = await caches.open(CACHES.pages);
  await pagesCache.put(url, res);

  // Find every /_next/static/... URL the shell references — script chunks,
  // stylesheets, modulepreloads, RSC payloads, etc. Cache them all so the
  // browser can render the page offline without a network round trip.
  const matches = html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g);
  const assetUrls = Array.from(new Set(Array.from(matches, (m) => m[1])));
  if (assetUrls.length === 0) return;

  const staticCache = await caches.open(CACHES.staticResources);
  await Promise.all(
    assetUrls.map(async (assetUrl) => {
      try {
        const assetRes = await fetch(assetUrl, {credentials: 'same-origin', cache: 'reload'});
        if (assetRes.ok) await staticCache.put(assetUrl, assetRes);
      } catch {
        // skip individual failures
      }
    }),
  );
}

async function rewrapForNavigation(response, request) {
  // For navigations served from a cache entry whose stored URL differs from
  // the navigated URL (any of our fallback paths), iOS Safari adopts
  // response.url as the document URL — dropping the ?trip=<id> query. Rewrap
  // into a fresh Response from the body bytes so the browser keeps the
  // navigation URL.
  if (request.mode !== 'navigate' && request.destination !== 'document') {
    return response;
  }
  if (!response || !response.url || response.url === request.url) {
    return response;
  }
  try {
    const buf = await response.arrayBuffer();
    return new Response(buf, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch {
    return response;
  }
}

async function matchPathPrefix(cache, prefix) {
  try {
    const keys = await cache.keys();
    for (const key of keys) {
      if (new URL(key.url).pathname.startsWith(prefix)) {
        return cache.match(key, {ignoreVary: true});
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function matchSamePath(cache, request) {
  try {
    const targetPath = new URL(request.url).pathname;
    const keys = await cache.keys();
    for (const key of keys) {
      if (new URL(key.url).pathname === targetPath) {
        return cache.match(key, {ignoreVary: true});
      }
    }
  } catch {
    // ignore
  }
  return undefined;
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
