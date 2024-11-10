"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function AddListDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListImage, setNewListImage] = useState<File | null>(null);
  const [newListDays, setNewListDays] = useState<number | null>(null);
  const [newListWeight, setNewListWeight] = useState<number | null>(null);
  const [newListParticipants, setNewListParticipants] = useState<number | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleCreateList = async () => {
    setIsSubmitting(true);
    try {
      // Prepare the form data
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

      // Send the form data to the API route
      const response = await fetch("/api/createList", {
        method: "POST",
        body: formData, // No need to set headers; the browser handles it
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create list");
      }

      // Reset form fields and close dialog
      setIsDialogOpen(false);
      setNewListName("");
      setNewListImage(null);
      setNewListDays(null);
      setNewListWeight(null);
      setNewListParticipants(null);

      // Refresh the page to show the new list
      router.refresh();
    } catch (error) {
      console.error("Error creating list:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Button to open the dialog */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="button-primary btn-center"
      >
        Add New List
      </button>

      {/* The Dialog for adding a new list */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal">
              Legg til ny pakkliste
            </DialogTitle>
          </DialogHeader>
          {/* Form Fields */}
          <div className="gap-y-4">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2">
                  Navn
                  <input
                    className="input"
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
                    className="input"
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
                    className="input"
                  />
                </label>
              </div>
              <div className="flex flex-col">
                <label className="flex flex-col gap-y-2">
                  Vekt
                  <input
                    type="number"
                    value={newListWeight ?? ""}
                    onChange={(e) =>
                      setNewListWeight(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="input"
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
                    className="input"
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleCreateList}
              className="button-primary-accent"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create List"}
            </button>
            <DialogClose asChild>
              <button type="button" className="button-secondary">
                Close
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
