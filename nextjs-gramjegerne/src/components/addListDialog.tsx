"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface AddListDialogProps {
  onSuccess?: () => Promise<void>;
}

export default function AddListDialog({ onSuccess }: AddListDialogProps) {
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

  const resetForm = () => {
    setNewListName("");
    setNewListImage(null);
    setNewListDays(null);
    setNewListWeight(null);
    setNewListParticipants(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCreateList = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", newListName);
      if (newListImage) {
        formData.append("image", newListImage);
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

      const response = await fetch("/api/createList", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create list");
      }

      setSuccessMessage("Liste opprettet!");

      // Call onSuccess before closing the dialog
      if (onSuccess) {
        await onSuccess();
      }

      // Close dialog and reset form after a brief delay
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 500);
    } catch (error) {
      console.error("Error creating list:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create list",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="button-create text-lg flex flex-row items-center gap-x-1 text-md"
      >
        <Icon name="add" width={24} height={24} />
        Ny pakkliste
      </button>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl text-accent font-normal">
              Ny pakkliste
            </DialogTitle>
          </DialogHeader>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          {successMessage && (
            <div className="text-green-500 mb-4">{successMessage}</div>
          )}

          {/* Form Fields */}
          <div className="gap-y-4">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2">
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
                <label className="flex flex-col gap-y-2">
                  Bilde
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNewListImage(e.target.files ? e.target.files[0] : null)
                    }
                    className="w-full max-w-full p-4"
                  />
                </label>
              </div>
              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2">
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
                <label className="flex flex-col gap-y-2">
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
          <DialogFooter>
            <button
              onClick={handleCreateList}
              className="button-primary-accent"
              disabled={isSubmitting || !newListName.trim()}
            >
              {isSubmitting ? "Oppretter..." : "Opprett"}
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
    </div>
  );
}
