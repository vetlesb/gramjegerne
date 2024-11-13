// src/components/NewItemForm.tsx

"use client";

import React, { useState, useEffect } from "react";

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

interface NewItemFormProps {
  onSuccess: () => Promise<void>; // Callback to refresh the items list
}

const NewItemForm: React.FC<NewItemFormProps> = ({ onSuccess }) => {
  // State Definitions
  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [size, setSize] = useState<string>("");
  const [weight, setWeight] = useState<{ weight: number; unit: string }>({
    weight: 0,
    unit: "g",
  });
  const [quantity, setQuantity] = useState<number>(0);
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
          setSelectedCategories([sortedCategories[0]._id]);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!name || !slug) {
      setErrorMessage("Navn og slug er obligatorisk.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    if (image) {
      formData.append("image", image);
    }

    // Append selected categories
    selectedCategories.forEach((categoryId) =>
      formData.append("categories", categoryId),
    );

    formData.append("size", size);
    formData.append("weight.weight", weight.weight.toString()); // Updated key
    formData.append("weight.unit", weight.unit); // Updated key
    formData.append("quantity", quantity.toString());
    formData.append("calories", calories.toString());

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Attempt to parse error message from response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error("Kunne ikke opprette utstyr.");
        }
        throw new Error(errorData.message || "Kunne ikke opprette utstyr.");
      }

      const result = await response.json();
      console.log("Utstyr opprettet:", result);

      setSuccessMessage("Utstyr opprettet suksessfullt!");
      await onSuccess(); // Refresh the items list

      // Reset Form
      setName("");
      setSlug("");
      setImage(null);
      setImagePreview(null);
      setSelectedCategories([]);
      setSize("");
      setWeight({ weight: 0, unit: "g" });
      setQuantity(0);
      setCalories(0);
    } catch (error: unknown) {
      console.error("Feil ved opprettelse av utstyr:", error);
      setErrorMessage("Kunne ikke opprette utstyr.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000); // Clear success message after 3 seconds
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
              <img
                src={imagePreview}
                alt="Image preview"
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
              value={selectedCategories[0]}
              onChange={(e) => {
                setSelectedCategories([e.target.value]);
              }}
              required
            >
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
