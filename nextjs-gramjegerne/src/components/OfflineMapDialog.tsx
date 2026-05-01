'use client';

import {useCallback, useEffect, useMemo, useRef, useState, type RefObject} from 'react';
import {toast} from 'sonner';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import type {MapDocument} from '@/types';
import type {TripMapRef} from '@/components/TripMap';
import {
  DEFAULT_BUNDLE_OPTIONS,
  deleteBundle,
  downloadBundle,
  estimateBundle,
  getBundle,
  getCoverageBboxes,
  type Bundle,
  type BundleOptions,
  type DownloadProgress,
} from '@/services/offlineMaps';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  map: MapDocument;
  mapRef: RefObject<TripMapRef | null>;
  onBundleChange: (bundle: Bundle | null) => void;
}

const MIN_BUFFER = 0.5;
const MAX_BUFFER = 5;
const STEP = 0.5;

export function OfflineMapDialog({open, onOpenChange, map, mapRef, onBundleChange}: Props) {
  const existing = useExistingBundle(open, map._id);
  const [bufferKm, setBufferKm] = useState(DEFAULT_BUNDLE_OPTIONS.bufferKm);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isDownloading = progress !== null;

  // Seed slider from existing bundle when dialog opens.
  useEffect(() => {
    if (!open) return;
    setBufferKm(existing?.bufferKm ?? DEFAULT_BUNDLE_OPTIONS.bufferKm);
  }, [open, existing?.bufferKm]);

  const options: BundleOptions = useMemo(
    () => ({...DEFAULT_BUNDLE_OPTIONS, bufferKm}),
    [bufferKm],
  );

  const estimate = useMemo(() => estimateBundle(map, options), [map, options]);

  // Drive coverage overlay on parent map whenever buffer changes.
  useEffect(() => {
    const mapImpl = mapRef.current;
    if (!open) {
      mapImpl?.clearCoverageOverlay();
      return;
    }
    const bboxes = getCoverageBboxes(map, bufferKm);
    mapImpl?.setCoverageOverlay(bboxes);
    return () => {
      mapImpl?.clearCoverageOverlay();
    };
  }, [open, map, bufferKm, mapRef]);

  const isStale = existing ? existing.mapUpdatedAt !== map._updatedAt : false;

  const handleDownload = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({total: estimate.tileCount, completed: 0, cached: 0, fetched: 0, failed: 0, bytes: 0});
    try {
      const bundle = await downloadBundle(map, options, {
        signal: controller.signal,
        onProgress: (p) => setProgress({...p}),
      });
      onBundleChange(bundle);
      toast.success(
        `Saved ${formatBytes(bundle.bytes)} for offline use${
          bundle.tileCount > 0 ? ` (${bundle.tileCount.toLocaleString()} tiles)` : ''
        }`,
      );
      onOpenChange(false);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        toast.info('Download cancelled');
      } else {
        console.error('offline download failed', err);
        toast.error('Could not save offline copy');
      }
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }, [map, options, estimate.tileCount, onOpenChange, onBundleChange]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRemove = useCallback(async () => {
    try {
      await deleteBundle(map._id);
      onBundleChange(null);
      toast.success('Offline copy removed');
      onOpenChange(false);
    } catch (err) {
      console.error('offline delete failed', err);
      toast.error('Could not remove offline copy');
    }
  }, [map._id, onBundleChange, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={isDownloading ? undefined : onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offline maps</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="text-sm text-white/70">
            Saves the Kartverket 1:50 000 topo around routes and spots, with a buffer you choose.
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <label htmlFor="offline-buffer">Buffer around routes &amp; spots</label>
              <span className="text-accent tabular-nums">{bufferKm.toFixed(1)} km</span>
            </div>
            <input
              id="offline-buffer"
              type="range"
              min={MIN_BUFFER}
              max={MAX_BUFFER}
              step={STEP}
              value={bufferKm}
              disabled={isDownloading}
              onChange={(e) => setBufferKm(parseFloat(e.target.value))}
              className="w-full accent-[var(--bg-accent)]"
            />
          </div>

          <EstimateRow
            tileCount={estimate.tileCount}
            estimatedBytes={estimate.estimatedBytes}
            zoomRange={options.zoomRange}
          />

          {existing && !isDownloading && (
            <ExistingBundleSummary bundle={existing} isStale={isStale} />
          )}

          {isDownloading && progress && <ProgressRow progress={progress} />}
        </div>

        <div className="flex flex-row justify-end gap-2 pt-2">
          {isDownloading ? (
            <button onClick={handleCancel} className="button-ghost px-3 py-2 text-sm">
              Cancel
            </button>
          ) : (
            <>
              {existing && (
                <button
                  onClick={handleRemove}
                  className="button-ghost px-3 py-2 text-sm text-red-300"
                >
                  Remove
                </button>
              )}
              <button onClick={() => onOpenChange(false)} className="button-ghost px-3 py-2 text-sm">
                Close
              </button>
              <button
                onClick={handleDownload}
                disabled={estimate.tileCount === 0}
                className="button-primary px-3 py-2 text-sm"
              >
                {existing ? (isStale ? 'Update' : 'Re-download') : 'Download'}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useExistingBundle(open: boolean, mapId: string): Bundle | null {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getBundle(mapId)
      .then((b) => {
        if (!cancelled) setBundle(b);
      })
      .catch((err) => {
        console.warn('getBundle failed', err);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mapId]);
  return bundle;
}

function EstimateRow({
  tileCount,
  estimatedBytes,
  zoomRange,
}: {
  tileCount: number;
  estimatedBytes: number;
  zoomRange: [number, number];
}) {
  return (
    <div className="rounded-md bg-white/5 px-3 py-2 text-sm flex justify-between">
      <span className="text-white/60">
        z{zoomRange[0]}–{zoomRange[1]} · ~{tileCount.toLocaleString()} tiles
      </span>
      <span className="tabular-nums">~{formatBytes(estimatedBytes)}</span>
    </div>
  );
}

function ExistingBundleSummary({bundle, isStale}: {bundle: Bundle; isStale: boolean}) {
  const downloaded = new Date(bundle.downloadedAt).toLocaleDateString();
  return (
    <div className="rounded-md border border-white/10 px-3 py-2 text-sm flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="text-white/60">Saved offline</span>
        <span className="tabular-nums">{formatBytes(bundle.bytes)}</span>
      </div>
      <div className="text-xs text-white/40">
        Downloaded {downloaded} · {bundle.tileCount.toLocaleString()} tiles
      </div>
      {isStale && (
        <div className="text-xs text-amber-300">Map has changed — update to refresh tiles.</div>
      )}
    </div>
  );
}

function ProgressRow({progress}: {progress: DownloadProgress}) {
  const pct = progress.total === 0 ? 0 : Math.floor((progress.completed / progress.total) * 100);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between">
        <span>
          {progress.completed.toLocaleString()} / {progress.total.toLocaleString()} tiles
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded">
        <div
          className="h-full bg-[var(--bg-accent)] rounded transition-[width]"
          style={{width: `${pct}%`}}
        />
      </div>
      <div className="text-xs text-white/50">
        {progress.fetched} fetched · {progress.cached} already cached
        {progress.failed > 0 ? ` · ${progress.failed} failed` : ''} · {formatBytes(progress.bytes)}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
