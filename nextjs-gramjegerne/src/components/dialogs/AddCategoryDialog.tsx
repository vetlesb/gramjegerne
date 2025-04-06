import {useState} from 'react';
import {Icon} from '@/components/Icon';
import type {Category} from '@/types';
import {Dialog, DialogContent} from '@/components/ui/dialog';
import {toast} from 'sonner';

function CategoryItem({
  category,
  onDelete,
  onUpdate,
}: {
  category: Category;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.title);

  const handleSubmit = () => {
    if (editedName.trim() !== '') {
      onUpdate(category._id, editedName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(category.title);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 group">
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') handleCancel();
            }}
            className="flex-1 bg-background border rounded px-2 py-1"
            autoFocus
          />
          <button onClick={handleSubmit} className="button-ghost">
            <Icon name="edit" width={16} height={16} />
          </button>
          <button onClick={handleCancel} className="button-ghost">
            <Icon name="close" width={16} height={16} />
          </button>
        </div>
      ) : (
        <>
          <span
            className="flex-1 cursor-pointer hover:text-accent"
            onClick={() => setIsEditing(true)}
          >
            {category.title}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity button-ghost"
          >
            <Icon name="edit" width={16} height={16} />
          </button>
        </>
      )}
      <button onClick={() => onDelete(category._id)} className="button-ghost">
        <Icon name="delete" width={16} height={16} />
      </button>
    </div>
  );
}

export function AddCategoryDialog() {
  const [categories, setCategories] = useState<Category[]>([]);

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch('/api/deleteCategory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({categoryId}),
      });

      if (!response.ok) throw new Error('Failed to delete category');

      setCategories(categories.filter((cat) => cat._id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleUpdateCategory = async (categoryId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title: newTitle}),
      });

      if (!response.ok) throw new Error('Failed to update category');

      setCategories(
        categories.map((cat) => (cat._id === categoryId ? {...cat, title: newTitle} : cat)),
      );
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  return (
    <Dialog>
      {/* ... existing Dialog.Trigger ... */}

      <DialogContent>
        {/* ... existing form ... */}

        <div className="space-y-2 mt-4">
          {categories.map((category) => (
            <CategoryItem
              key={category._id}
              category={category}
              onDelete={handleDeleteCategory}
              onUpdate={handleUpdateCategory}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
