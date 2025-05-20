'use client';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {client} from '@/sanity/client';
import {ListDocument} from '@/types';
import imageUrlBuilder from '@sanity/image-url';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import Image from 'next/image';
import {useEffect, useState} from 'react';
import {compressImage} from '@/utils/imageCompression';

// Add image builder
const builder = imageUrlBuilder(client);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

interface AddListDialogProps {
  onSuccess?: () => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editList?: ListDocument;
}

export function AddListDialog({
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  editList,
}: AddListDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListImage, setNewListImage] = useState<File | null>(null);
  const [newListDays, setNewListDays] = useState<number | null>(null);
  const [newListWeight, setNewListWeight] = useState<number | null>(null);
  const [newListParticipants, setNewListParticipants] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<SanityImageSource | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Handle controlled/uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : isDialogOpen;
  const handleOpenChange = onOpenChange || setIsDialogOpen;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (editList) {
        setNewListName(editList.name);
        setNewListDays(editList.days ?? null);
        setNewListParticipants(editList.participants ?? null);
        setIsCompleted(editList.completed ?? false);
        if (editList.image) {
          setExistingImage(editList.image);
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, editList]);

  const resetForm = () => {
    setNewListName('');
    setNewListImage(null);
    setExistingImage(null);
    setNewListDays(null);
    setNewListWeight(null);
    setNewListParticipants(null);
    setIsCompleted(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveList = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', newListName);
      formData.append('completed', isCompleted.toString());

      // Handle image upload
      if (newListImage) {
        const compressedFile = await compressImage(newListImage);
        formData.append('image', compressedFile);
        formData.append('keepExistingImage', 'false');
      } else if (existingImage) {
        formData.append('keepExistingImage', 'true');
      }

      if (newListDays !== null) {
        formData.append('days', newListDays.toString());
      }
      if (newListWeight !== null) {
        formData.append('weight', newListWeight.toString());
      }
      if (newListParticipants !== null) {
        formData.append('participants', newListParticipants.toString());
      }

      // Include user ID
      const userId = 'your-google-user-id'; // Replace with actual user ID retrieval logic
      formData.append('userId', userId);

      const url = editList ? `/api/list/${editList._id}` : '/api/createList';
      const method = editList ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to save list: ${response.status} ${response.statusText}`);
      }

      setSuccessMessage(editList ? 'Liste oppdatert!' : 'Liste opprettet!');

      if (onSuccess) {
        await onSuccess();
      }

      setTimeout(() => {
        handleOpenChange(false);
        resetForm();
      }, 500);
    } catch (error) {
      console.error('Error saving list:', error);
      setError(error instanceof Error ? error.message : 'Failed to save list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress the image before uploading
      const compressedFile = await compressImage(file);

      // Now use the compressed file for your upload
      setNewListImage(compressedFile);
      setExistingImage(null);
    } catch (error) {
      console.error('Error compressing image:', error);
      // Handle error appropriately
    }
  };

  return (
    <>
      {!editList && (
        <div>
          <button
            onClick={() => handleOpenChange(true)}
            className="button-create flex flex-shrink-0 text-md items-center gap-x-1"
          >
            Add
          </button>
        </div>
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
        <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl text-accent font-normal pb-4">
              {editList ? 'Edit' : 'New'}
            </DialogTitle>
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
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    required
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
                        src={urlFor(existingImage).url()}
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
                <label className="flex flex-col gap-y-2 text-lg">
                  Days
                  <input
                    type="number"
                    value={newListDays ?? ''}
                    onChange={(e) =>
                      setNewListDays(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-full max-w-full p-4"
                  />
                </label>
              </div>

              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2 text-lg">
                  Participants
                  <input
                    type="number"
                    value={newListParticipants ?? ''}
                    onChange={(e) =>
                      setNewListParticipants(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-full max-w-full p-4"
                  />
                </label>
              </div>

              <div className="flex items-center gap-x-2">
                <label className="flex items-center gap-x-2 text-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(e) => setIsCompleted(e.target.checked)}
                    className="w-6 h-6"
                  />
                  Completed
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-y-2">
            <button
              onClick={handleSaveList}
              className="button-primary-accent"
              disabled={isSubmitting || !newListName.trim()}
            >
              {isSubmitting ? 'Saving...' : editList ? 'Update' : 'Create'}
            </button>
            <DialogClose asChild>
              <button type="button" className="button-secondary" onClick={resetForm}>
                Cancel
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
