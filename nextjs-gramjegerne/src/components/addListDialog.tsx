"use client";
import { useState } from "react";
import { client } from "@/sanity/client";
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
      // Prepare the data for the new list
      let imageAsset = null;
      if (newListImage) {
        // Upload the image to Sanity
        const imageData = await client.assets.upload("image", newListImage);
        imageAsset = {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: imageData._id,
          },
        };
      }

      // Create the new list document
      const newList = {
        _type: "list",
        name: newListName,
        slug: {
          _type: "slug",
          current: newListName.toLowerCase().replace(/\s+/g, "-"),
        },
        image: imageAsset,
        days: newListDays,
        weight: newListWeight,
        participants: newListParticipants,
        items: [],
      };

      // Save the new list to Sanity
      await client.create(newList);

      // Close the dialog and reset form fields
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
              Add New List
            </DialogTitle>
          </DialogHeader>
          {/* Form Fields */}
          <div className="gap-y-4">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col">
                <label htmlFor="list-name">Name</label>
                <input
                  id="list-name"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="list-image">Image</label>
                <input
                  id="list-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setNewListImage(e.target.files ? e.target.files[0] : null)
                  }
                  className="input"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="list-days">Days</label>
                <input
                  id="list-days"
                  type="number"
                  value={newListDays ?? ""}
                  onChange={(e) =>
                    setNewListDays(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="input"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="list-weight">Weight</label>
                <input
                  id="list-weight"
                  type="number"
                  value={newListWeight ?? ""}
                  onChange={(e) =>
                    setNewListWeight(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="input"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="list-participants">Participants</label>
                <input
                  id="list-participants"
                  type="number"
                  value={newListParticipants ?? ""}
                  onChange={(e) =>
                    setNewListParticipants(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="input"
                />
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
