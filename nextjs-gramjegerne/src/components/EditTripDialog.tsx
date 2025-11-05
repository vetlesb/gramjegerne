'use client';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {TripListItem} from '@/types';
import {useEffect, useState} from 'react';

interface EditTripDialogProps {
  trip: TripListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function EditTripDialog({trip, open, onOpenChange, onSuccess}: EditTripDialogProps) {
  const [tripName, setTripName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTripName(trip.name);
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, trip.name]);

  const resetForm = () => {
    setTripName(trip.name);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveTrip = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/updateTrip', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: trip._id,
          updates: {
            name: tripName.trim(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trip');
      }

      setSuccessMessage('Trip updated!');

      if (onSuccess) {
        await onSuccess();
      }

      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 500);
    } catch (error) {
      console.error('Error updating trip:', error);
      setError(error instanceof Error ? error.message : 'Failed to update trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal pb-4">Edit Trip</DialogTitle>
        </DialogHeader>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

        {/* Form Fields */}
        <div className="gap-y-4">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                Trip Name
                <input
                  className="w-full max-w-full p-4"
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex mt-4 gap-y-4 gap-x-2">
          <DialogClose asChild>
            <button type="button" className="button-secondary" onClick={resetForm}>
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={handleSaveTrip}
            className="button-primary-accent"
            disabled={isSubmitting || !tripName.trim() || tripName.trim() === trip.name}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
