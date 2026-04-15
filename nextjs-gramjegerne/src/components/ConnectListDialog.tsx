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

interface UserList {
  _id: string;
  name: string;
  slug: {current: string};
  connectedTrip?: {_id: string};
}

interface ConnectListDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function ConnectListDialog({tripId, open, onOpenChange, onSuccess}: ConnectListDialogProps) {
  const {data: session} = useSession();
  const [lists, setLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!open || !session?.user?.id) return;

    const fetchLists = async () => {
      setIsLoading(true);
      try {
        const query = groq`*[_type == "list" && user._ref == $userId] | order(name asc) {
          _id,
          name,
          slug,
          "connectedTrip": connectedTrip->{_id}
        }`;
        const data = await client.fetch(query, {userId: session.user.id});
        // Only show lists not already connected to this trip
        setLists(data.filter((l: UserList) => l.connectedTrip?._id !== tripId));
      } catch (error) {
        console.error('Error fetching lists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [open, session?.user?.id, tripId]);

  const handleConnect = async (listId: string) => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/connectListToTrip', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({listId, tripId}),
      });

      if (!response.ok) throw new Error('Failed to connect list');

      if (onSuccess) await onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error connecting list:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal pb-4">
            Connect a packing list
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : lists.length === 0 ? (
          <p className="text-lg py-4">No available lists to connect. Create a list first.</p>
        ) : (
          <div className="flex flex-col gap-y-2 py-4">
            {lists.map((list) => (
              <Button
                key={list._id}
                variant="tertiary"
                onClick={() => handleConnect(list._id)}
                disabled={isConnecting}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-lg">{list.name}</span>
                {list.connectedTrip && (
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
