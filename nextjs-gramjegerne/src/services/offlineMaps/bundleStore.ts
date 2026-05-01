import type {MapDocument} from '@/types';

const DB_NAME = 'gramjegerne-offline-maps';
const DB_VERSION = 1;
const STORE = 'mapBundles';

export type BundleOptions = {
  layer: 'Kartverket Raster';
  zoomRange: [number, number];
  bufferKm: number;
};

export type Bundle = BundleOptions & {
  mapId: string;
  mapUpdatedAt: string;
  tileCount: number;
  bytes: number;
  downloadedAt: string;
  mapDocSnapshot: MapDocument;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable in this environment'));
  }
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, {keyPath: 'mapId'});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IDB'));
  });
  return dbPromise;
}

function txStore(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getBundle(mapId: string): Promise<Bundle | null> {
  const db = await openDB();
  const result = await reqToPromise(txStore(db, 'readonly').get(mapId));
  return (result as Bundle | undefined) ?? null;
}

export async function listBundles(): Promise<Bundle[]> {
  const db = await openDB();
  const result = await reqToPromise(txStore(db, 'readonly').getAll());
  return result as Bundle[];
}

export async function putBundle(bundle: Bundle): Promise<void> {
  const db = await openDB();
  await reqToPromise(txStore(db, 'readwrite').put(bundle));
}

export async function deleteBundleRecord(mapId: string): Promise<void> {
  const db = await openDB();
  await reqToPromise(txStore(db, 'readwrite').delete(mapId));
}
