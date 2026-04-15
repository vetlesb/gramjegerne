'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/Button';
import {useEffect, useState} from 'react';
import {useSession} from 'next-auth/react';
import {client} from '@/sanity/client';
import {groq} from 'next-sanity';

interface UserMap {
  _id: string;
  name: string;
  connectedTrip?: {_id: string};
}

interface ConnectMapDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function ConnectMapDialog({tripId, open, onOpenChange, onSuccess}: ConnectMapDialogProps) {
  const {data: session} = useSession();
  const [maps, setMaps] = useState<UserMap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!open || !session?.user?.id) return;

    const fetchMaps = async () => {
      setIsLoading(true);
      try {
        const query = groq`*[_type == "map" && user._ref == $userId] | order(name asc) {
          _id,
          name,
          "connectedTrip": connectedTrip->{_id}
        }`;
        const data = await client.fetch(query, {userId: session.user.id});
        setMaps(data.filter((m: UserMap) => m.connectedTrip?._id !== tripId));
      } catch (error) {
        console.error('Error fetching maps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaps();
  }, [open, session?.user?.id, tripId]);

  const handleConnect = async (mapId: string) => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/connectMapToTrip', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({mapId, tripId}),
      });

      if (!response.ok) throw new Error('Failed to connect map');

      if (onSuccess) await onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error connecting map:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal pb-4">
            Connect a map
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : maps.length === 0 ? (
          <p className="text-lg py-4">No available maps to connect. Create a map first.</p>
        ) : (
          <div className="flex flex-col gap-y-2 py-4">
            {maps.map((map) => (
              <Button
                key={map._id}
                variant="tertiary"
                onClick={() => handleConnect(map._id)}
                disabled={isConnecting}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-lg">{map.name}</span>
                {map.connectedTrip && (
                  <span className="text-sm text-white/50">Connected to another trip</span>
                )}
              </Button>
            ))}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <button type="button" className="button-secondary">
              Cancel
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
