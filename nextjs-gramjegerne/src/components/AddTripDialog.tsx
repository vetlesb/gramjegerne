'use client';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {useState} from 'react';
import {TripListItem} from '@/types';

interface AddTripDialogProps {
  onSuccess?: (newTrip: TripListItem) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTripDialog({onSuccess, open: controlledOpen, onOpenChange}: AddTripDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle controlled/uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : isDialogOpen;
  const handleOpenChange = onOpenChange || setIsDialogOpen;

  const resetForm = () => {
    setTripName('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleCreateTrip = async () => {
    if (!tripName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/createTrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tripName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trip');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create trip');
      }

      setSuccessMessage('Trip created!');

      if (onSuccess) {
        await onSuccess(data.trip);
      }

      setTimeout(() => {
        handleOpenChange(false);
        resetForm();
      }, 500);
    } catch (error) {
      console.error('Error creating trip:', error);
      setError(error instanceof Error ? error.message : 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger button when not controlled */}
      {controlledOpen === undefined && (
        <button
          onClick={() => handleOpenChange(true)}
          className="button-primary-accent w-full text-lg flex items-center justify-center gap-2 py-3"
        >
          New Map
        </button>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          handleOpenChange(open);
        }}
      >
        <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-accent font-normal pb-4">Add new map</DialogTitle>
          </DialogHeader>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

          {/* Form Fields */}
          <div className="gap-y-4">
            <div className="flex flex-col gap-y-8">
              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2 text-lg">
                  Title
                  <input
                    className="w-full max-w-full p-4"
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="e.g., Jotunheimen Summer 2024"
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
              onClick={handleCreateTrip}
              className="button-primary-accent"
              disabled={isSubmitting || !tripName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
