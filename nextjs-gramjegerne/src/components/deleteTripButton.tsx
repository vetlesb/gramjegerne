'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Icon} from './Icon';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from './ui/dialog';

interface DeleteTripButtonProps {
  tripId: string;
  tripName: string;
  redirectTo?: string;
  onSuccess?: () => void;
}

export function DeleteTripButton({tripId, tripName, redirectTo, onSuccess}: DeleteTripButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/deleteTrip?tripId=${encodeURIComponent(tripId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete trip');
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      setIsDialogOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    setIsDialogOpen(false);
  };

  return (
    <>
      <button
        className="button-ghost p-2 text-white rounded-md transition-colors"
        onClick={(event) => {
          event.stopPropagation(); // Prevents the parent onClick from firing
          event.preventDefault(); // Prevents any default behavior
          setIsDialogOpen(true);
        }}
        title="Delete trip"
      >
        <Icon name="delete" width={20} height={20} />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dialog gap-y-8" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-accent font-normal">
              Are you sure you want to delete the trip?
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-lg">
            <span className="text-xl p-4 bg-dimmed-hover rounded-md">{tripName}</span>
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <DialogFooter className="gap-y-4 gap-x-1">
            <button onClick={handleDelete} className="button-primary-accent" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={handleCancel} type="button" className="button-secondary">
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
