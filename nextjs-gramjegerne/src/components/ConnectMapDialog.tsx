'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {MapCardCompact, type CompactMap} from '@/components/MapCard/MapCardCompact';
import {urlFor} from '@/sanity/images';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSession} from 'next-auth/react';
import {toast} from 'sonner';
import {client} from '@/sanity/client';
import {groq} from 'next-sanity';
import {useLanguage} from '@/i18n/LanguageProvider';

interface ConnectMapDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function ConnectMapDialog({tripId, open, onOpenChange, onSuccess}: ConnectMapDialogProps) {
  const {t} = useLanguage();
  const {data: session} = useSession();
  const [maps, setMaps] = useState<CompactMap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !session?.user?.id) return;

    // Reset state on open
    setSearchQuery('');
    setSelectedIds(new Set());

    const fetchMaps = async () => {
      setIsLoading(true);
      try {
        const query = groq`*[_type == "map" && user._ref == $userId] | order(name asc) {
          _id,
          name,
          image,
          "connectedTripIds": connectedTrips[]._ref,
          "campingSpotsCount": count(campingSpots),
          "routesCount": count(routes),
          "routes": routes[]{waypoints, elevationGain}
        }`;
        const data = await client.fetch(query, {userId: session.user.id});
        // Only show maps not already connected to this trip
        setMaps(
          data.filter(
            (m: CompactMap & {connectedTripIds?: string[]}) =>
              !m.connectedTripIds?.includes(tripId),
          ),
        );
      } catch (error) {
        console.error('Error fetching maps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaps();
  }, [open, session?.user?.id, tripId]);

  const filteredMaps = useMemo(() => {
    if (!searchQuery) return maps;
    const q = searchQuery.toLowerCase();
    return maps.filter((m) => m.name.toLowerCase().includes(q));
  }, [maps, searchQuery]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBatchConnect = async () => {
    const count = selectedIds.size;
    setIsConnecting(true);
    try {
      for (const mapId of selectedIds) {
        const response = await fetch('/api/connectMapToTrip', {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({mapId, tripId}),
        });
        if (!response.ok) throw new Error(`Failed to connect map ${mapId}`);
      }
      if (onSuccess) await onSuccess();
      onOpenChange(false);
      toast.success(
        count === 1
          ? t.trips.mapConnected
          : t.trips.mapsConnected.replace('{count}', String(count)),
        {duration: 3000, position: 'bottom-center'},
      );
    } catch (error) {
      console.error('Error connecting maps:', error);
      toast.error('Failed to connect. Please try again.', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog p-4 max-w-lg md:p-5 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal">
            {t.maps.connectMap}
          </DialogTitle>
        </DialogHeader>

        <label className="flex flex-col pt-2 gap-y-2 text-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-full p-4 mb-1"
            placeholder={t.misc.searchMaps}
          />
        </label>

        <div className="flex-grow overflow-y-auto max-h-[60vh] no-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : maps.length === 0 ? (
            <p className="text-lg py-4">{t.maps.noMapsToConnect}</p>
          ) : filteredMaps.length === 0 ? (
            <p className="text-lg py-4">{t.misc.noMatches}</p>
          ) : (
            <ul className="flex flex-col gap-y-1">
              {filteredMaps.map((map) => (
                <MapCardCompact
                  key={map._id}
                  map={map}
                  isSelected={selectedIds.has(map._id)}
                  onClick={() => handleToggle(map._id)}
                  imageUrlBuilder={(asset) => urlFor(asset)}
                />
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleBatchConnect}
            disabled={selectedIds.size === 0 || isConnecting}
            className="button-primary-accent flex-1 mt-4"
          >
            {selectedIds.size === 0
              ? t.trips.connectMap
              : `${t.trips.connectMap} (${selectedIds.size})`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
