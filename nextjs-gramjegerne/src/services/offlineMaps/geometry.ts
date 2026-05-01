import type {CampingSpot, Route} from '@/types';

export type LngLat = {lng: number; lat: number};
export type Bbox = {minLng: number; minLat: number; maxLng: number; maxLat: number};
export type TileCoord = {z: number; x: number; y: number};

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEG_LAT = 111.32;

export const KARTVERKET_TEMPLATE =
  'https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png';

export const KARTVERKET_LAYER_NAME = 'Kartverket Raster';

export function tileToUrl(tile: TileCoord): string {
  return KARTVERKET_TEMPLATE.replace('{z}', String(tile.z))
    .replace('{x}', String(tile.x))
    .replace('{y}', String(tile.y));
}

export function lngLatToTile(lng: number, lat: number, z: number): {x: number; y: number} {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return {
    x: clamp(x, 0, n - 1),
    y: clamp(y, 0, n - 1),
  };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function kmPerDegLng(lat: number) {
  return Math.cos((lat * Math.PI) / 180) * 111.32;
}

export function bufferLngLat(point: LngLat, km: number): Bbox {
  const dLat = km / KM_PER_DEG_LAT;
  const dLng = km / kmPerDegLng(point.lat);
  return {
    minLng: point.lng - dLng,
    minLat: point.lat - dLat,
    maxLng: point.lng + dLng,
    maxLat: point.lat + dLat,
  };
}

export function bufferSegment(a: LngLat, b: LngLat, km: number): Bbox {
  const minLat = Math.min(a.lat, b.lat);
  const maxLat = Math.max(a.lat, b.lat);
  const minLng = Math.min(a.lng, b.lng);
  const maxLng = Math.max(a.lng, b.lng);
  const dLat = km / KM_PER_DEG_LAT;
  const widestLat = Math.max(Math.abs(minLat), Math.abs(maxLat));
  const dLng = km / kmPerDegLng(widestLat);
  return {
    minLng: minLng - dLng,
    minLat: minLat - dLat,
    maxLng: maxLng + dLng,
    maxLat: maxLat + dLat,
  };
}

export function tilesForBbox(bbox: Bbox, z: number): TileCoord[] {
  const topLeft = lngLatToTile(bbox.minLng, bbox.maxLat, z);
  const bottomRight = lngLatToTile(bbox.maxLng, bbox.minLat, z);
  const tiles: TileCoord[] = [];
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({z, x, y});
    }
  }
  return tiles;
}

export type CoverageInput = {
  routes: Pick<Route, 'waypoints'>[];
  campingSpots: Pick<CampingSpot, 'coordinates'>[];
};

export type CoverageOptions = {
  zoomRange: [number, number];
  bufferKm: number;
};

export function getCoverageBboxes(coverage: CoverageInput, bufferKm: number): Bbox[] {
  const boxes: Bbox[] = [];
  for (const route of coverage.routes) {
    const wp = route.waypoints;
    if (wp.length === 0) continue;
    if (wp.length === 1) {
      boxes.push(bufferLngLat(wp[0], bufferKm));
      continue;
    }
    for (let i = 0; i < wp.length - 1; i++) {
      boxes.push(bufferSegment(wp[i], wp[i + 1], bufferKm));
    }
  }
  for (const spot of coverage.campingSpots) {
    boxes.push(bufferLngLat(spot.coordinates, bufferKm));
  }
  return boxes;
}

export function getTilesForCoverage(
  coverage: CoverageInput,
  options: CoverageOptions,
): TileCoord[] {
  const [minZoom, maxZoom] = options.zoomRange;
  if (minZoom > maxZoom) return [];

  const bboxes = getCoverageBboxes(coverage, options.bufferKm);
  const seen = new Set<string>();
  const tiles: TileCoord[] = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    for (const bbox of bboxes) {
      for (const tile of tilesForBbox(bbox, z)) {
        const key = `${tile.z}/${tile.x}/${tile.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        tiles.push(tile);
      }
    }
  }
  return tiles;
}

// Bytes-per-tile estimate for Kartverket toporaster PNGs (empirical).
export const KARTVERKET_AVG_BYTES_PER_TILE = 20_000;

export function estimateBytes(tileCount: number): number {
  return tileCount * KARTVERKET_AVG_BYTES_PER_TILE;
}

export function haversineKm(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
