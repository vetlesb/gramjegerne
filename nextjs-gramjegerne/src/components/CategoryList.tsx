import {useState, useMemo} from 'react';
import {Icon} from '@/components/Icon';
import type {Category} from '@/types';

interface CategoryListProps {
  categories: Category[];
  onUpdate: (categoryId: string, newTitle: string) => void;
  onDelete: (categoryId: string) => void;
}

export function CategoryList({categories, onUpdate, onDelete}: CategoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // This sorting logic is correct and should work
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a: Category, b: Category) => a.title.localeCompare(b.title, 'nb'));
  }, [categories]);

  const handleStartEdit = (category: Category) => {
    setEditingId(category._id);
    setEditingTitle(category.title);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleSubmit = (categoryId: string) => {
    if (editingTitle.trim() !== '') {
      onUpdate(categoryId, editingTitle.trim());
      setEditingId(null);
      setEditingTitle('');
    }
  };

  return (
    <ul className="category-list p-2 no-scrollbar flex flex-col gap-y-2 max-h-[50vh] overflow-y-auto">
      {sortedCategories.map((category) => (
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
                  if (e.key === 'Enter') handleSubmit(category._id);
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <button onClick={() => handleSubmit(category._id)} className="button-ghost">
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
                <button className="button-ghost" onClick={() => onDelete(category._id)}>
                  <Icon name="delete" width={16} height={16} />
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
