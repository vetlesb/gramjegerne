'use client';
import {Icon} from '@/components/Icon';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {useRouter} from 'next/navigation';
import {useState} from 'react';

interface DeleteListButtonProps {
  listId: string;
  listName: string;
  redirectTo?: string;
  onSuccess?: () => void;
}

export function DeleteListButton({listId, listName, redirectTo, onSuccess}: DeleteListButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/deleteList?listId=${encodeURIComponent(listId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete list');
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      setIsDialogOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        className="button-trans text-lg flex flex-row items-center justify-center gap-x-1"
        onClick={(event) => {
          event.stopPropagation(); // Prevents the parent onClick from firing
          event.preventDefault(); // Prevents any default behavior
          setIsDialogOpen(true);
        }}
        title="Delete list"
      >
        <Icon name="delete" width={24} height={24} />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dialog gap-y-8">
          <DialogHeader>
            <DialogTitle className="text-2xl text-accent font-normal">
              Are you sure you want to delete the list?
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-lg">
            <span className="text-xl p-4 bg-dimmed-hover rounded-md">{listName}</span>
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <DialogFooter className="gap-y-4 gap-x-1">
            <button onClick={handleDelete} className="button-primary-accent" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
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
