// src/components/NewItemForm.tsx

'use client';

import {Icon} from '@/components/Icon';
import {LoadingSpinner} from '@/components/ui/LoadingSpinner'; // Add this import
import {Command} from 'cmdk';
import Image from 'next/image';
import React, {useEffect, useState} from 'react';

interface Category {
  _id: string;
  title: string;
  slug: {current: string};
}

interface NewItemFormProps {
  onSuccess?: (item: Record<string, unknown>) => void;
}

function NewItemForm({onSuccess}: NewItemFormProps) {
  // State Definitions
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [weight, setWeight] = useState<{weight: string; unit: string}>({
    weight: '',
    unit: 'g',
  });
  const [calories, setCalories] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState('');
  const [isAddingCategory] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch Categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/getCategories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data: Category[] = await response.json();

        // Sort categories alphabetically by title
        const sortedCategories = [...data].sort((a, b) => a.title.localeCompare(b.title, 'nb'));

        setCategories(sortedCategories);
      } catch (error) {
        console.error(error);
        setErrorMessage('Kunne ikke hente kategorier.');
      }
    };

    fetchCategories();
  }, []);
  // Automatically generate slug when name changes
  useEffect(() => {
    if (name) {
      const generatedSlug = name.toLowerCase().replace(/\s+/g, '-').slice(0, 200);
      setSlug(generatedSlug);
    } else {
      setSlug('');
    }
  }, [name]);

  // Handle Image Input Changes
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImage(file || null); // Ensure null is set if no file is selected

    // Generate a preview URL if a file is selected
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    } else {
      setImagePreview(null); // Clear preview if no file is selected
    }
  }

  // Handle Image Removal
  function handleImageRemoval() {
    setImage(null);
    setImagePreview(null);
  }

  // Filter categories based on input
  const filteredCategories = categories.filter(
    (category) =>
      !categoryInput || category.title.toLowerCase().includes(categoryInput.toLowerCase()),
  );

  // Handle new category creation
  const handleAddCategory = async (categoryTitle: string) => {
    try {
      const response = await fetch('/api/addCategory', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: categoryTitle}),
      });

      if (!response.ok) throw new Error('Failed to add category');

      const newCategory = await response.json();
      // Use the same sorting logic when updating categories
      setCategories((prev) =>
        [...prev, newCategory].sort((a, b) => a.title.localeCompare(b.title, 'nb')),
      );
      setSelectedCategory(newCategory._id);
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      // Required fields
      formData.append('name', name.trim());
      formData.append('slug', JSON.stringify({current: slug}));
      formData.append('category', selectedCategory); // Make sure category is always sent

      // Optional fields with validation
      if (image) {
        formData.append('image', image);
      }

      if (size && size.trim()) {
        formData.append('size', size.trim());
      }

      // Weight handling
      if (weight.weight) {
        formData.append(
          'weight',
          JSON.stringify({
            weight: parseFloat(weight.weight) || 0,
            unit: weight.unit,
          }),
        );
      }

      if (calories && parseInt(calories, 10) > 0) {
        formData.append('calories', calories);
      } else {
        // Don't append calories at all if it's 0 or less
        console.log("Skipping calories as it's 0 or less");
      }

      // Debug log
      console.log('Sending form data:', {
        name: name.trim(),
        slug,
        category: selectedCategory,
        size: size.trim(),
        weight: weight.weight ? weight : null,
        calories: calories && parseInt(calories, 10) > 0 ? calories : null,
      });

      const response = await fetch('/api/createItem', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create item');
      }

      const result = await response.json();

      // Reset form
      setName('');
      setSlug('');
      setImage(null);
      setImagePreview(null);
      setSelectedCategory(categories[0]?._id || '');
      setSize('');
      setWeight({weight: '', unit: 'g'});
      setCalories('');

      setSuccessMessage('Gear created!');

      // Call onSuccess callback with the result
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error creating item:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not create item. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Add this useEffect near your other effects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const commandRoot = document.querySelector('[cmdk-root]');
      const isCommandInput = target.closest('[cmdk-input]');

      if (commandRoot && !commandRoot.contains(target) && !isCommandInput) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div className="toast text-lg bg-green-100 text-green-800 p-4 rounded-md mb-4">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="toast text-lg bg-red-100 text-red-800 p-4 rounded-md mb-4">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        {/* Name field */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Name *
            <input
              className="w-full max-w-full p-4"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
            />
          </label>
        </div>

        {/* Image Upload */}
        <div>
          <label className="flex flex-col gap-y-2">
            Image
            <input
              type="file"
              className="w-full max-w-full p-4"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
          {imagePreview && (
            <div className="mt-4 relative">
              <Image
                src={imagePreview}
                alt="Forhåndsvisning"
                width={96}
                height={96}
                className="h-24 w-24 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={handleImageRemoval}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                title="Remove image"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Category field */}
        <div>
          <label className="flex flex-col gap-y-2">
            Category *
            <div className="relative w-full">
              <Command
                className="relative"
                shouldFilter={false}
                loop={true}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              >
                <div className="relative">
                  <Command.Input
                    value={
                      selectedCategory
                        ? categories.find((c) => c._id === selectedCategory)?.title || ''
                        : categoryInput
                    }
                    onValueChange={(value) => {
                      setCategoryInput(value);
                      if (selectedCategory) {
                        setSelectedCategory(''); // Clear selection only when actively typing
                      }
                      setIsOpen(true);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(!isOpen);
                    }}
                    readOnly={selectedCategory !== ''} // Make input readonly when category is selected
                    className="w-full p-4 border border-gray-300 rounded cursor-pointer"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {selectedCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory('');
                          setCategoryInput('');
                        }}
                        className="p-1 rounded-md"
                        title="Remove selected category"
                      >
                        <Icon name="close" width={16} height={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                      }}
                      className="p-1"
                    >
                      <Icon name="chevrondown" width={16} height={16} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="absolute w-full mt-2 bg-dimmed border border-accent rounded-md shadow-lg z-[60]">
                    <Command.List className="max-h-[300px] overflow-auto p-2">
                      <Command.Empty className="p-4 text-sm text-gray-500">
                        Ingen kategorier funnet.
                        {categoryInput && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddCategory(categoryInput);
                              setIsOpen(false);
                            }}
                            className="button-primary-accent text-lg flex items-center gap-1 mt-2 text-secondary"
                          >
                            <Icon name="add" width={24} height={24} /> Opprett &ldquo;
                            {categoryInput}&rdquo;
                            {isAddingCategory && <LoadingSpinner size="sm" />}
                          </button>
                        )}
                      </Command.Empty>

                      {filteredCategories.map((category) => (
                        <Command.Item
                          key={category._id}
                          value={category._id}
                          onSelect={() => {
                            // Use setTimeout to ensure state updates happen after event handling
                            setTimeout(() => {
                              setSelectedCategory(category._id);
                              setCategoryInput('');
                              setIsOpen(false);
                            }, 0);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-dimmed focus:bg-dimmed outline-none rounded"
                        >
                          {category.title}
                        </Command.Item>
                      ))}
                    </Command.List>
                  </div>
                )}
              </Command>
            </div>
          </label>
        </div>

        {/* Size */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Size
            <input
              type="text"
              className="w-full max-w-full p-4"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </label>
        </div>

        {/* Weight field - make sure it's properly validated */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Weight *
            <div className="flex flex-row gap-x-2">
              <input
                type="number"
                className="w-full max-w-full p-4"
                value={weight.weight}
                onChange={(e) =>
                  setWeight({
                    ...weight,
                    weight: e.target.value,
                  })
                }
                min="0"
                step="0.1"
                required
              />
              <select
                className="w-full max-w-full p-4"
                value={weight.unit}
                onChange={(e) => setWeight({...weight, unit: e.target.value})}
              >
                <option value="g">g</option>
              </select>
            </div>
          </label>
        </div>

        {/* Calories */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Calories
            <input
              type="number"
              className="w-full max-w-full p-4"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min="0"
            />
          </label>
        </div>

        {/* Submit Button */}
        <button className="button-primary-accent py-2 px-4" type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add'}
        </button>
      </form>
    </div>
  );
}

export default NewItemForm;
