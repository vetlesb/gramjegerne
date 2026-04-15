'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Icon} from '@/components/Icon';
import {TripCategory} from '@/types';
import {useState} from 'react';

interface ManageTripCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TripCategory[];
  onChange: () => Promise<void>;
}

export function ManageTripCategoriesDialog({
  open,
  onOpenChange,
  categories,
  onChange,
}: ManageTripCategoriesDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isAdding) return;

    setIsAdding(true);
    setError(null);
    try {
      const response = await fetch('/api/tripCategories', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: newCategoryName.trim()}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add category');
      }

      await onChange();
      setNewCategoryName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (category: TripCategory) => {
    setEditingId(category._id);
    setEditingTitle(category.title);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleSubmitEdit = async (categoryId: string) => {
    if (!editingTitle.trim()) return;
    try {
      const response = await fetch('/api/tripCategories', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({categoryId, title: editingTitle.trim()}),
      });

      if (!response.ok) throw new Error('Failed to update category');

      await onChange();
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Delete this category? Trips using it will lose their category.')) return;
    try {
      const response = await fetch(
        `/api/tripCategories?categoryId=${encodeURIComponent(categoryId)}`,
        {method: 'DELETE'},
      );

      if (!response.ok) throw new Error('Failed to delete category');

      await onChange();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const sorted = [...categories].sort((a, b) => a.title.localeCompare(b.title, 'nb'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog p-4 md:p-10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal pb-8">
            Add category
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAdd} className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-4 gap-x-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="p-4 rounded flex-1"
              required
              placeholder="Category title"
            />
            <button type="submit" className="button-primary-accent" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        <p className="mt-6">Categories</p>
        <ul className="category-list p-2 no-scrollbar flex flex-col gap-y-2 max-h-[50vh] overflow-y-auto">
          {sorted.map((category) => (
            <li key={category._id} className="category p-2 flex justify-between items-center">
              {editingId === category._id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="p-2 rounded flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitEdit(category._id);
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                  <button onClick={() => handleSubmitEdit(category._id)} className="button-ghost">
                    <Icon name="checkmark" width={16} height={16} />
                  </button>
                  <button onClick={handleCancel} className="button-ghost">
                    <Icon name="close" width={16} height={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 cursor-pointer" onClick={() => handleStartEdit(category)}>
                    {category.title}
                  </span>
                  <div className="flex gap-x-2">
                    <button className="button-ghost" onClick={() => handleStartEdit(category)}>
                      <Icon name="edit" width={16} height={16} />
                    </button>
                    <button className="button-ghost" onClick={() => handleDelete(category._id)}>
                      <Icon name="delete" width={16} height={16} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
