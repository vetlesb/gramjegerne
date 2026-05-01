'use client';

import {useCallback, useEffect, useState, type RefObject} from 'react';
import {toast} from 'sonner';
import {Icon} from '@/components/Icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {OfflineMapDialog} from '@/components/OfflineMapDialog';
import {getBundle, type Bundle} from '@/services/offlineMaps';
import type {MapDocument} from '@/types';
import type {TripMapRef} from '@/components/TripMap';

interface Props {
  map: MapDocument;
  shareId?: string;
  mapRef: RefObject<TripMapRef | null>;
}

export function MapActionsMenu({map, shareId, mapRef}: Props) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [offlineDialogOpen, setOfflineDialogOpen] = useState(false);
  const [bundle, setBundle] = useState<Bundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBundle(map._id)
      .then((b) => {
        if (!cancelled) setBundle(b);
      })
      .catch((err) => console.warn('getBundle failed', err));
    return () => {
      cancelled = true;
    };
  }, [map._id]);

  const isStale = bundle ? bundle.mapUpdatedAt !== map._updatedAt : false;

  const handleShare = useCallback(async () => {
    try {
      setIsGeneratingLink(true);
      let currentShareId = shareId;
      if (!currentShareId) {
        const response = await fetch('/api/updateMap', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            mapId: map._id,
            updates: {
              shareId: `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              isShared: true,
            },
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to generate share link: ${errorData.error || response.statusText}`);
        }
        const data = await response.json();
        currentShareId = data.map.shareId as string;
      }
      const shareUrl = `${window.location.origin}/maps?share=${currentShareId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success(`${map.name} link copied to clipboard!`, {duration: 3000, position: 'bottom-center'});
    } catch (err) {
      console.error('Share failed:', err);
      toast.error('Could not generate share link', {duration: 3000, position: 'bottom-center'});
    } finally {
      setIsGeneratingLink(false);
    }
  }, [map._id, map.name, shareId]);

  const offlineLabel = bundle
    ? isStale
      ? 'Update offline copy'
      : `Manage offline (${formatBytes(bundle.bytes)})`
    : 'Save offline';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="button-ghost p-2 text-white rounded-md transition-colors relative"
            title="Map actions"
            aria-label="Map actions"
          >
            <Icon name="ellipsis" width={20} height={20} />
            {bundle && (
              <span
                className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                  isStale ? 'bg-amber-400' : 'bg-[var(--bg-accent)]'
                }`}
                aria-hidden
              />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem onSelect={handleShare} disabled={isGeneratingLink}>
            <Icon name="link" width={16} height={16} className="mr-2" />
            <span>{isGeneratingLink ? 'Generating link…' : 'Share map'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOfflineDialogOpen(true)}>
            <Icon name="document" width={16} height={16} className="mr-2" />
            <span>{offlineLabel}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OfflineMapDialog
        open={offlineDialogOpen}
        onOpenChange={setOfflineDialogOpen}
        map={map}
        mapRef={mapRef}
        onBundleChange={setBundle}
      />
    </>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
