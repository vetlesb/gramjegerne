'use client';

import {downloadTile, hasTile, removeTile, saveTile} from 'leaflet.offline';
import type {MapDocument} from '@/types';
import {
  type Bundle,
  type BundleOptions,
  deleteBundleRecord,
  getBundle,
  listBundles,
  putBundle,
} from './bundleStore';
import {
  KARTVERKET_LAYER_NAME,
  KARTVERKET_TEMPLATE,
  type TileCoord,
  estimateBytes,
  getNorwayBaseTiles,
  getTilesForCoverage,
  tileToUrl,
} from './geometry';

export type {Bundle, BundleOptions} from './bundleStore';
export {listBundles, getBundle} from './bundleStore';
export {getCoverageBboxes} from './geometry';
export type {Bbox, CoverageInput, LngLat} from './geometry';

export type BundleEstimate = {
  tileCount: number;
  estimatedBytes: number;
};

export type DownloadProgress = {
  total: number;
  completed: number;
  cached: number;
  fetched: number;
  failed: number;
  bytes: number;
};

export type DownloadOptions = {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  concurrency?: number;
};

const DEFAULT_CONCURRENCY = 6;

export const DEFAULT_BUNDLE_OPTIONS: BundleOptions = {
  layer: KARTVERKET_LAYER_NAME,
  zoomRange: [7, 14],
  bufferKm: 2,
};

// Country-wide low-zoom base pack — downloaded once on first save offline so
// the map always has at least country/regional context tiles, even outside
// the saved trip corridor.
const BASE_PACK_ZOOM_RANGE: [number, number] = [1, 6];
const BASE_PACK_FLAG = 'gramjegerne-base-pack-v1';

function isBasePackInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BASE_PACK_FLAG) === 'installed';
  } catch {
    return false;
  }
}

function markBasePackInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BASE_PACK_FLAG, 'installed');
  } catch {
    // ignore
  }
}

export function estimateBundle(map: MapDocument, options: BundleOptions): BundleEstimate {
  const tiles = getTilesForCoverage(map, {
    zoomRange: options.zoomRange,
    bufferKm: options.bufferKm,
  });
  return {
    tileCount: tiles.length,
    estimatedBytes: estimateBytes(tiles.length),
  };
}

export async function downloadBundle(
  map: MapDocument,
  options: BundleOptions,
  {onProgress, signal, concurrency = DEFAULT_CONCURRENCY}: DownloadOptions = {},
): Promise<Bundle> {
  await requestPersistedStorage();

  // On first save ever, prepend country-wide low-zoom tiles so the map has
  // base context outside the trip corridor. Subsequent saves skip this.
  const baseTiles = isBasePackInstalled() ? [] : getNorwayBaseTiles(BASE_PACK_ZOOM_RANGE);

  const bundleTiles = getTilesForCoverage(map, {
    zoomRange: options.zoomRange,
    bufferKm: options.bufferKm,
  });

  const tiles = [...baseTiles, ...bundleTiles];

  const progress: DownloadProgress = {
    total: tiles.length,
    completed: 0,
    cached: 0,
    fetched: 0,
    failed: 0,
    bytes: 0,
  };
  onProgress?.({...progress});

  let nextIndex = 0;
  const workers = Array.from({length: Math.max(1, concurrency)}, () =>
    runWorker(tiles, () => nextIndex++, progress, options, onProgress, signal),
  );
  await Promise.all(workers);

  if (signal?.aborted) {
    throw new DOMException('Download aborted', 'AbortError');
  }

  // Mark base pack installed only if we actually attempted it AND the
  // overall download wasn't catastrophic — at least most base tiles must
  // have made it through (allowing a few network blips).
  if (baseTiles.length > 0) {
    const baseFailures = Math.max(0, progress.failed - Math.floor(bundleTiles.length * 0.1));
    if (baseFailures < baseTiles.length * 0.5) {
      markBasePackInstalled();
    }
  }

  const bundle: Bundle = {
    mapId: map._id,
    mapUpdatedAt: map._updatedAt,
    layer: options.layer,
    // Persist only the trip-specific range, not the base pack range.
    zoomRange: options.zoomRange,
    bufferKm: options.bufferKm,
    tileCount: progress.completed,
    bytes: progress.bytes,
    downloadedAt: new Date().toISOString(),
    mapDocSnapshot: map,
  };
  await putBundle(bundle);

  // Warm the SW pages cache for the trip's view route so it works offline
  // even if the user has never navigated there directly. The SW's
  // networkFirst will cache this fetch under the path key.
  warmTripRouteCache(map._id);

  return bundle;
}

function warmTripRouteCache(mapId: string): void {
  if (typeof fetch === 'undefined') return;
  fetch(`/maps/${encodeURIComponent(mapId)}`, {
    credentials: 'same-origin',
    cache: 'reload',
  }).catch(() => {
    // best-effort
  });
}

async function runWorker(
  tiles: TileCoord[],
  takeIndex: () => number,
  progress: DownloadProgress,
  options: BundleOptions,
  onProgress: ((p: DownloadProgress) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<void> {
  while (true) {
    if (signal?.aborted) return;
    const i = takeIndex();
    if (i >= tiles.length) return;
    const tile = tiles[i];
    const url = tileToUrl(tile);

    try {
      const cached = await hasTile(url);
      if (cached) {
        progress.cached++;
      } else {
        const blob = await downloadTile(url);
        await saveTile(
          {
            key: url,
            url,
            urlTemplate: KARTVERKET_TEMPLATE,
            x: tile.x,
            y: tile.y,
            z: tile.z,
            createdAt: Date.now(),
          },
          blob,
        );
        progress.fetched++;
        progress.bytes += blob.size;
      }
      progress.completed++;
    } catch (err) {
      if (signal?.aborted) return;
      progress.failed++;
      progress.completed++;
      console.warn('tile download failed', url, err);
    }

    onProgress?.({...progress});
    void options;
  }
}

export async function deleteBundle(mapId: string): Promise<void> {
  const target = await getBundle(mapId);
  if (!target) return;

  const others = (await listBundles()).filter((b) => b.mapId !== mapId);
  const targetTiles = bundleTileUrls(target);
  const survivingTiles = new Set<string>();
  for (const other of others) {
    for (const url of bundleTileUrls(other)) survivingTiles.add(url);
  }

  await Promise.all(
    targetTiles
      .filter((url) => !survivingTiles.has(url))
      .map((url) => removeTile(url).catch(() => undefined)),
  );

  await deleteBundleRecord(mapId);
}

function bundleTileUrls(bundle: Bundle): string[] {
  return getTilesForCoverage(bundle.mapDocSnapshot, {
    zoomRange: bundle.zoomRange,
    bufferKm: bundle.bufferKm,
  }).map(tileToUrl);
}

async function requestPersistedStorage(): Promise<void> {
  if (typeof navigator === 'undefined') return;
  if (!navigator.storage?.persist) return;
  try {
    const already = await navigator.storage.persisted();
    if (!already) await navigator.storage.persist();
  } catch {
    // Best-effort only.
  }
}
