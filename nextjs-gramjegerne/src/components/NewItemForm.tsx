// src/components/NewItemForm.tsx

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

interface NewItemFormProps {
  onSuccess?: (item: Record<string, unknown>) => void;
}

const NewItemForm: React.FC<NewItemFormProps> = ({ onSuccess }) => {
  // State Definitions
  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [weight, setWeight] = useState<{ weight: number; unit: string }>({
    weight: 0,
    unit: "g",
  });
  const [calories, setCalories] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Fetch Categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/getCategories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data: Category[] = await response.json();

        // Sort categories alphabetically by title
        const sortedCategories = [...data].sort(
          (a, b) => a.title.localeCompare(b.title, "nb"), // 'nb' for Norwegian sorting
        );

        setCategories(sortedCategories);

        // Set the first category as selected by default
        if (sortedCategories.length > 0) {
          setSelectedCategory(sortedCategories[0]._id);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Kunne ikke hente kategorier.");
      }
    };

    fetchCategories();
  }, []);
  // Automatically generate slug when name changes
  useEffect(() => {
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .slice(0, 200);
      setSlug(generatedSlug);
    } else {
      setSlug("");
    }
  }, [name]);

  // Handle Image Input Changes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImage(file || null); // Ensure null is set if no file is selected

    // Generate a preview URL if a file is selected
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    } else {
      setImagePreview(null); // Clear preview if no file is selected
    }
  };

  // Handle Image Removal
  const handleImageRemoval = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);

      if (image) {
        formData.append("image", image);
      }

      if (selectedCategory) {
        formData.append("category", selectedCategory);
      }

      if (size) {
        formData.append("size", size);
      }

      if (weight.weight > 0) {
        formData.append("weight.weight", weight.weight.toString());
        formData.append("weight.unit", weight.unit);
      }

      if (calories > 0) {
        formData.append("calories", calories.toString());
      }

      console.log("Client: Sending form data:", Object.fromEntries(formData));

      const response = await fetch("/api/createItem", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log("Client: Raw response:", responseText);

      if (!response.ok) {
        let errorMessage = "Failed to create item";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Client: Error parsing response:", e);
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log("Client: Item created:", result);

      // Reset form
      setName("");
      setSlug("");
      setSelectedCategory("");

      setSuccessMessage("Utstyr opprettet!");

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Client: Detailed error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not create item. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Item Name */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Navn
            <input
              className="w-full max-w-full p-4"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Skriv inn utstyrsnavn"
            />
          </label>
        </div>

        {/* Image Upload */}
        <div>
          <label className="flex flex-col gap-y-2">
            Bilde
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
                title="Fjern bilde"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="flex flex-col gap-y-2">
            Kategori
            <select
              className="w-full max-w-full p-4"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Size */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Størrelse
            <input
              type="text"
              className="w-full max-w-full p-4"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Skriv inn størrelse"
            />
          </label>
        </div>

        {/* Weight */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Vekt
            <div className="flex flex-row gap-x-2">
              <input
                type="number"
                className="w-full max-w-full p-4"
                value={weight.weight}
                onChange={(e) =>
                  setWeight({ ...weight, weight: parseFloat(e.target.value) })
                }
                placeholder="Vekt"
                min="0"
                required
              />
              <select
                className="w-full max-w-full p-4"
                value={weight.unit}
                onChange={(e) => setWeight({ ...weight, unit: e.target.value })}
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </label>
        </div>

        {/* Calories */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Kalorier
            <input
              type="number"
              className="w-full max-w-full p-4"
              value={calories}
              onChange={(e) => setCalories(parseInt(e.target.value, 10))}
              placeholder="Skriv inn kalorier"
              min="0"
              required
            />
          </label>
        </div>

        {/* Submit Button */}
        <button
          className="button-primary-accent py-2 px-4"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Oppretter..." : "Opprett"}
        </button>
      </form>
    </div>
  );
};

export default NewItemForm;
