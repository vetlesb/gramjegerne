'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {ListCardCompact, type CompactList} from '@/components/ListCard/ListCardCompact';
import {urlFor} from '@/sanity/images';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSession} from 'next-auth/react';
import {toast} from 'sonner';
import {client} from '@/sanity/client';
import {groq} from 'next-sanity';
import {useLanguage} from '@/i18n/LanguageProvider';

interface ConnectListDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function ConnectListDialog({tripId, open, onOpenChange, onSuccess}: ConnectListDialogProps) {
  const {t} = useLanguage();
  const {data: session} = useSession();
  const [lists, setLists] = useState<CompactList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !session?.user?.id) return;

    // Reset state on open
    setSearchQuery('');
    setSelectedIds(new Set());

    const fetchLists = async () => {
      setIsLoading(true);
      try {
        const query = groq`*[_type == "list" && user._ref == $userId] | order(name asc) {
          _id,
          name,
          slug,
          image,
          "connectedTripIds": connectedTrips[]._ref,
          "items": items[]{
            quantity,
            "weight": item->weight.weight
          }
        }`;
        const data = await client.fetch(query, {userId: session.user.id});
        // Only show lists not already connected to this trip
        setLists(
          data.filter(
            (l: CompactList & {connectedTripIds?: string[]}) =>
              !l.connectedTripIds?.includes(tripId),
          ),
        );
      } catch (error) {
        console.error('Error fetching lists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [open, session?.user?.id, tripId]);

  const filteredLists = useMemo(() => {
    if (!searchQuery) return lists;
    const q = searchQuery.toLowerCase();
    return lists.filter((l) => l.name.toLowerCase().includes(q));
  }, [lists, searchQuery]);

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
      for (const listId of selectedIds) {
        const response = await fetch('/api/connectListToTrip', {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({listId, tripId}),
        });
        if (!response.ok) throw new Error(`Failed to connect list ${listId}`);
      }
      if (onSuccess) await onSuccess();
      onOpenChange(false);
      toast.success(
        count === 1
          ? t.trips.listConnected
          : t.trips.listsConnected.replace('{count}', String(count)),
        {duration: 3000, position: 'bottom-center'},
      );
    } catch (error) {
      console.error('Error connecting lists:', error);
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
            {t.trips.connectAList}
          </DialogTitle>
        </DialogHeader>

        <label className="flex flex-col pt-2 gap-y-2 text-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-full p-4 mb-1"
            placeholder={t.misc.searchLists}
          />
        </label>

        <div className="flex-grow overflow-y-auto max-h-[60vh] no-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : lists.length === 0 ? (
            <p className="text-lg py-4">{t.trips.noListsToConnect}</p>
          ) : filteredLists.length === 0 ? (
            <p className="text-lg py-4">{t.misc.noMatches}</p>
          ) : (
            <ul className="flex flex-col gap-y-1">
              {filteredLists.map((list) => (
                <ListCardCompact
                  key={list._id}
                  list={list}
                  isSelected={selectedIds.has(list._id)}
                  onClick={() => handleToggle(list._id)}
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
              ? t.trips.connectList
              : `${t.trips.connectList} (${selectedIds.size})`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
