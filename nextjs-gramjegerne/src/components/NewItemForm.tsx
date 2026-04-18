// src/components/NewItemForm.tsx

'use client';

import {CategoryCombobox} from '@/components/CategoryCombobox';
import {useLanguage} from '@/i18n/LanguageProvider';
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
  const {t} = useLanguage();
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
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

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
        setErrorMessage(t.gear.couldNotFetchCategories);
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

      if (description && description.trim()) {
        formData.append('description', description.trim());
      }

      if (price && parseFloat(price) > 0) {
        formData.append('price', price);
      }

      // Debug log
      console.log('Sending form data:', {
        name: name.trim(),
        slug,
        category: selectedCategory,
        size: size.trim(),
        weight: weight.weight ? weight : null,
        calories: calories && parseInt(calories, 10) > 0 ? calories : null,
        price: price && parseFloat(price) > 0 ? price : null,
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
      setDescription('');
      setPrice('');

      setSuccessMessage(t.gear.gearCreated);

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
            {t.labels.name} *
            <input
              className="w-full max-w-full p-4"
              type="text"
              value={name}
              placeholder="Title"
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
            />
          </label>
        </div>

        {/* Category field */}
        <div>
          <CategoryCombobox
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            onCreateNew={async (title) => {
              await handleAddCategory(title);
            }}
            label={t.labels.category}
            required
          />
        </div>

        {/* Weight field - make sure it's properly validated */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            {t.labels.weightGrams} *
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
                step="1"
                required
                placeholder="g"
              />
            </div>
          </label>
        </div>

        {/* Size */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            {t.labels.size}
            <input
              type="text"
              className="w-full max-w-full p-4"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </label>
        </div>

        {/* Calories */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            {t.labels.calories}
            <input
              type="number"
              className="w-full max-w-full p-4"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min="0"
            />
          </label>
        </div>

        {/* Image Upload */}
        <div>
          <label className="flex flex-col gap-y-2">
            {t.labels.image}
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
                alt="Preview"
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

        {/* Description */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            {t.labels.description}
            <textarea
              className="w-full max-w-full p-4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
        </div>

        {/* Price */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            {t.labels.price}
            <input
              type="number"
              className="w-full max-w-full p-4"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </label>
        </div>

        {/* Submit Button */}
        <button className="button-primary-accent py-2 px-4 mt-2" type="submit" disabled={isLoading}>
          {isLoading ? t.actions.adding : t.actions.add}
        </button>
      </form>
    </div>
  );
}

export default NewItemForm;
