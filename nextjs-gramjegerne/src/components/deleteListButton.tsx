"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface DeleteListButtonProps {
  listId: string;
  listName: string;
  redirectTo?: string; // Optional prop for redirection
}

export default function DeleteListButton({
  listId,
  listName,
  redirectTo,
}: DeleteListButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null); // Reset previous errors
    try {
      const response = await fetch(
        `/api/deleteList?listId=${encodeURIComponent(listId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete list");
      }

      // If a redirect path is provided, navigate to it; otherwise, refresh the page
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting list:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <button
        className="button-ghost flex gap-x-2 items-center"
        onClick={(event) => {
          event.stopPropagation(); // Prevents the parent onClick from firing
          event.preventDefault(); // Prevents any default behavior
          setIsDialogOpen(true);
        }}
      >
        <svg
          className="btn-icon"
          viewBox="0 0 16 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.125 17.3359C3.10938 17.3359 2.39844 16.6406 2.35156 15.6406L1.76562 3.97656H0.648438C0.40625 3.97656 0.195312 3.77344 0.195312 3.52344C0.195312 3.27344 0.40625 3.0625 0.648438 3.0625H4.32812V1.79688C4.32812 0.742188 5.00781 0.109375 6.13281 0.109375H9.1875C10.3125 0.109375 11 0.742188 11 1.79688V3.0625H14.6797C14.9297 3.0625 15.1328 3.26562 15.1328 3.52344C15.1328 3.77344 14.9375 3.97656 14.6797 3.97656H13.5703L12.9922 15.6406C12.9453 16.6406 12.2188 17.3359 11.2109 17.3359H4.125ZM5.28125 1.84375V3.0625H10.0391V1.84375C10.0391 1.32812 9.69531 1.00781 9.14062 1.00781H6.17969C5.63281 1.00781 5.28125 1.32812 5.28125 1.84375ZM4.20312 16.4219H11.125C11.625 16.4219 12.0156 16.0391 12.0391 15.5391L12.5938 3.97656H2.71094L3.29688 15.5391C3.32031 16.0391 3.71094 16.4219 4.20312 16.4219ZM5.33594 14.9141C5.10156 14.9141 4.95312 14.7656 4.94531 14.5469L4.6875 5.90625C4.6875 5.6875 4.84375 5.53906 5.07812 5.53906C5.29688 5.53906 5.45312 5.67969 5.46094 5.89844L5.71875 14.5469C5.72656 14.7578 5.57031 14.9141 5.33594 14.9141ZM7.67188 14.9141C7.4375 14.9141 7.27344 14.7656 7.27344 14.5469V5.90625C7.27344 5.6875 7.4375 5.53906 7.67188 5.53906C7.90625 5.53906 8.0625 5.6875 8.0625 5.90625V14.5469C8.0625 14.7656 7.90625 14.9141 7.67188 14.9141ZM10 14.9219C9.76562 14.9219 9.60938 14.7656 9.61719 14.5469L9.875 5.89844C9.88281 5.67969 10.0391 5.53906 10.2578 5.53906C10.4922 5.53906 10.6484 5.6875 10.6484 5.91406L10.3906 14.5547C10.3828 14.7734 10.2266 14.9219 10 14.9219Z"
            fill="#EAFFE2"
          />
        </svg>
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dialog gap-y-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <p>
              Er du sikker på at du vil slette listen &quot;
              <strong>{listName}</strong>&quot;?
            </p>
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <DialogFooter className="gap-y-4 gap-x-1">
            <button
              onClick={handleDelete}
              className="button-primary-accent"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <DialogClose asChild>
              <button type="button" className="button-secondary">
                Cancel
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
