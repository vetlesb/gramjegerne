"use client";
import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ListDocument } from "@/types";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";

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

export default function AddListDialog({
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  editList,
}: AddListDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListImage, setNewListImage] = useState<File | null>(null);
  const [newListDays, setNewListDays] = useState<number | null>(null);
  const [newListWeight, setNewListWeight] = useState<number | null>(null);
  const [newListParticipants, setNewListParticipants] = useState<number | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<SanityImageSource | null>(
    null,
  );

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
        // Handle existing image
        if (editList.image) {
          setExistingImage(editList.image);
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, editList]);

  const resetForm = () => {
    setNewListName("");
    setNewListImage(null);
    setExistingImage(null);
    setNewListDays(null);
    setNewListWeight(null);
    setNewListParticipants(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveList = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", newListName);

      // Handle image upload
      if (newListImage) {
        formData.append("image", newListImage);
        formData.append("keepExistingImage", "false");
      } else if (existingImage) {
        formData.append("keepExistingImage", "true");
      }

      if (newListDays !== null) {
        formData.append("days", newListDays.toString());
      }
      if (newListWeight !== null) {
        formData.append("weight", newListWeight.toString());
      }
      if (newListParticipants !== null) {
        formData.append("participants", newListParticipants.toString());
      }

      // Include user ID
      const userId = "your-google-user-id"; // Replace with actual user ID retrieval logic
      formData.append("userId", userId);

      const url = editList ? `/api/list/${editList._id}` : "/api/createList";
      const method = editList ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(
          `Failed to save list: ${response.status} ${response.statusText}`,
        );
      }

      setSuccessMessage(editList ? "Liste oppdatert!" : "Liste opprettet!");

      if (onSuccess) {
        await onSuccess();
      }

      setTimeout(() => {
        handleOpenChange(false);
        resetForm();
      }, 500);
    } catch (error) {
      console.error("Error saving list:", error);
      setError(error instanceof Error ? error.message : "Failed to save list");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!editList && (
        <div>
          <button
            onClick={() => handleOpenChange(true)}
            className="button-create text-lg flex flex-row items-center gap-x-1 text-md"
          >
            <Icon name="add" width={24} height={24} />
            Ny pakkliste
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
              {editList ? "Rediger pakkliste" : "Ny pakkliste"}
            </DialogTitle>
          </DialogHeader>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          {successMessage && (
            <div className="text-green-500 mb-4">{successMessage}</div>
          )}

          {/* Form Fields */}
          <div className="gap-y-4">
            <div className="flex flex-col gap-y-8">
              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2 text-lg">
                  Navn
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
                  Bilde
                  {existingImage && (
                    <div className="mb-2">
                      <p className="text-sm mb-2">Eksisterende bilde:</p>
                      <Image
                        src={urlFor(existingImage).url()}
                        alt="Eksisterende bilde"
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      setNewListImage(file);
                      if (file) {
                        setExistingImage(null);
                      }
                    }}
                    className="w-full max-w-full p-4"
                  />
                </label>
              </div>
              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2 text-lg">
                  Antall dager
                  <input
                    type="number"
                    value={newListDays ?? ""}
                    onChange={(e) =>
                      setNewListDays(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-full max-w-full p-4"
                  />
                </label>
              </div>

              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2 text-lg">
                  Deltakere
                  <input
                    type="number"
                    value={newListParticipants ?? ""}
                    onChange={(e) =>
                      setNewListParticipants(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-full max-w-full p-4"
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={handleSaveList}
              className="button-primary-accent"
              disabled={isSubmitting || !newListName.trim()}
            >
              {isSubmitting ? "Lagrer..." : editList ? "Oppdater" : "Opprett"}
            </button>
            <DialogClose asChild>
              <button
                type="button"
                className="button-secondary"
                onClick={resetForm}
              >
                Avbryt
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
