'use client';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {MapListItem} from '@/types';
import {useEffect, useState} from 'react';

interface EditMapDialogProps {
  map: MapListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function EditMapDialog({map, open, onOpenChange, onSuccess}: EditMapDialogProps) {
  const [mapName, setMapName] = useState('');
  const [defaultTileLayer, setDefaultTileLayer] = useState<'Kartverket Raster' | 'ESRI Satellite' | 'OpenStreetMap'>('Kartverket Raster');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setMapName(map.name);
      setDefaultTileLayer(map.defaultTileLayer || 'Kartverket Raster');
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, map.name, map.defaultTileLayer]);

  const resetForm = () => {
    setMapName(map.name);
    setDefaultTileLayer(map.defaultTileLayer || 'Kartverket Raster');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveMap = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/updateMap', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mapId: map._id,
          updates: {
            name: mapName.trim(),
            defaultTileLayer,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update map');
      }

      setSuccessMessage('Map updated!');

      if (onSuccess) {
        await onSuccess();
      }

      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 500);
    } catch (error) {
      console.error('Error updating map:', error);
      setError(error instanceof Error ? error.message : 'Failed to update map');
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
          <DialogTitle className="text-2xl text-accent font-normal pb-4">Edit Map</DialogTitle>
        </DialogHeader>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

        {/* Form Fields */}
        <div className="gap-y-4">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                Map Name
                <input
                  className="w-full max-w-full p-4"
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
            </div>

            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                Default Map Style
                <select
                  className="w-full max-w-full p-4"
                  value={defaultTileLayer}
                  onChange={(e) => setDefaultTileLayer(e.target.value as 'Kartverket Raster' | 'ESRI Satellite' | 'OpenStreetMap')}
                >
                  <option value="Kartverket Raster">NO Topo (Kartverket)</option>
                  <option value="ESRI Satellite">Satellite (ESRI)</option>
                  <option value="OpenStreetMap">Street Map (OSM)</option>
                </select>
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
            onClick={handleSaveMap}
            className="button-primary-accent"
            disabled={isSubmitting || !mapName.trim() || (mapName.trim() === map.name && defaultTileLayer === (map.defaultTileLayer || 'Kartverket Raster'))}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
