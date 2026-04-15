'use client';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {CategoryCombobox} from '@/components/CategoryCombobox';
import {TripCategory} from '@/types';
import {compressImage} from '@/utils/imageCompression';
import {useEffect, useState} from 'react';
import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import {client} from '@/sanity/client';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';

const builder = imageUrlBuilder(client);
function urlForSource(source: SanityImageSource) {
  return builder.image(source);
}

interface AddTripDialogProps {
  onSuccess?: () => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editTrip?: {
    _id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    category?: {_id: string; title: string};
    image?: SanityImageSource;
    mapsRestrictedToOwner?: boolean;
  };
}

export function AddTripDialog({
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  editTrip,
}: AddTripDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<TripCategory[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<SanityImageSource | null>(null);
  const [mapsRestrictedToOwner, setMapsRestrictedToOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : isDialogOpen;
  const handleOpenChange = onOpenChange || setIsDialogOpen;

  // Fetch trip categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/tripCategories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.sort((a: TripCategory, b: TripCategory) => a.title.localeCompare(b.title, 'nb')));
      }
    } catch (error) {
      console.error('Error fetching trip categories:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (editTrip) {
        setName(editTrip.name);
        setDescription(editTrip.description || '');
        setStartDate(editTrip.startDate || '');
        setEndDate(editTrip.endDate || '');
        setSelectedCategory(editTrip.category?._id || '');
        setMapsRestrictedToOwner(editTrip.mapsRestrictedToOwner || false);
        if (editTrip.image) setExistingImage(editTrip.image);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editTrip]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('');
    setImage(null);
    setExistingImage(null);
    setMapsRestrictedToOwner(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedFile = await compressImage(file);
      setImage(compressedFile);
      setExistingImage(null);
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  };

  const handleCreateCategory = async (title: string) => {
    try {
      const response = await fetch('/api/tripCategories', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title}),
      });

      if (!response.ok) throw new Error('Failed to create category');

      const newCategory = await response.json();
      setCategories((prev) =>
        [...prev, newCategory].sort((a, b) => a.title.localeCompare(b.title, 'nb')),
      );
      setSelectedCategory(newCategory._id);
    } catch (error) {
      console.error('Error creating trip category:', error);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (startDate) formData.append('startDate', startDate);
      if (endDate) formData.append('endDate', endDate);
      if (selectedCategory) formData.append('categoryId', selectedCategory);
      formData.append('mapsRestrictedToOwner', String(mapsRestrictedToOwner));

      if (image) {
        formData.append('image', image);
        formData.append('keepExistingImage', 'false');
      } else if (existingImage) {
        formData.append('keepExistingImage', 'true');
      }

      if (editTrip) {
        formData.append('tripId', editTrip._id);
      }

      const url = editTrip ? '/api/updateTrip' : '/api/createTrip';
      const method = editTrip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save trip');
      }

      setSuccessMessage(editTrip ? 'Trip updated!' : 'Trip created!');

      if (onSuccess) {
        await onSuccess();
      }

      setTimeout(() => {
        handleOpenChange(false);
        resetForm();
      }, 500);
    } catch (error) {
      console.error('Error saving trip:', error);
      setError(error instanceof Error ? error.message : 'Failed to save trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        handleOpenChange(open);
      }}
    >
      <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal pb-4">
            {editTrip ? 'Edit trip' : 'New trip'}
          </DialogTitle>
        </DialogHeader>

        {error && <div className="text-red-500 mb-4">{error}</div>}
        {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

        <div className="gap-y-4">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                Title
                <input
                  className="w-full max-w-full p-4"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jotunheimen Summer 2025"
                  required
                  autoFocus
                />
              </label>
            </div>

            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                Image
                {existingImage && (
                  <div className="mb-2">
                    <p className="text-sm mb-2">Existing image:</p>
                    <Image
                      src={urlForSource(existingImage).url()}
                      alt="Existing image"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded-md"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full max-w-full p-4"
                />
              </label>
            </div>

            <div className="flex flex-col">
              <CategoryCombobox
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
                onCreateNew={handleCreateCategory}
                label="Category"
              />
            </div>

            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full max-w-full p-4"
                />
              </label>
            </div>

            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full max-w-full p-4"
                />
              </label>
            </div>

            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2 text-lg">
                Description
                <textarea
                  className="w-full max-w-full p-4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description..."
                />
              </label>
            </div>

            <div className="flex items-center gap-x-2">
              <label className="flex items-center gap-x-2 text-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapsRestrictedToOwner}
                  onChange={(e) => setMapsRestrictedToOwner(e.target.checked)}
                  className="w-6 h-6"
                />
                Only I can add maps
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
            onClick={handleSave}
            className="button-primary-accent"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Saving...' : editTrip ? 'Update' : 'Create'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
