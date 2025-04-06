'use client';

import React from 'react';
import type {Category} from '@/types';

interface AddCategoryFormProps {
  onSuccess: (newCategory: Category) => void;
}

export function AddCategoryForm({onSuccess}: AddCategoryFormProps) {
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/addCategory', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: newCategoryName}),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add category');
      }

      onSuccess(data);
      setNewCategoryName('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-4 gap-x-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="p-4 rounded flex-1"
          required
          placeholder="Category title"
        />
        <button type="submit" className="button-primary-accent" disabled={isLoading}>
          {isLoading ? 'Adding...' : <>Add</>}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
