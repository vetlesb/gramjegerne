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
        className="button-create flex flex-row items-center gap-x-2 text-md"
      >
        <span className="icon-wrapper">
          <svg
            className="tag-icon"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-0.0078125 7.35938C-0.0078125 6.88281 0.390625 6.48438 0.867188 6.48438H5.65625V1.69531C5.65625 1.21875 6.05469 0.820312 6.53125 0.820312C7.00781 0.820312 7.40625 1.21875 7.40625 1.69531V6.48438H12.1953C12.6719 6.48438 13.0703 6.88281 13.0703 7.35938C13.0703 7.84375 12.6719 8.23438 12.1953 8.23438H7.40625V13.0234C7.40625 13.5 7.00781 13.8984 6.53125 13.8984C6.05469 13.8984 5.65625 13.5 5.65625 13.0234V8.23438H0.867188C0.390625 8.23438 -0.0078125 7.84375 -0.0078125 7.35938Z"
              fill="#EAFFE2"
            />
          </svg>
        </span>
        Opprett pakkliste
      </button>

      {/* The Dialog for adding a new list */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl text-accent font-normal">
              Opprett pakkliste
            </DialogTitle>
          </DialogHeader>
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
                  Vekt
                  <input
                    type="number"
                    value={newListWeight ?? ""}
                    onChange={(e) =>
                      setNewListWeight(
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
