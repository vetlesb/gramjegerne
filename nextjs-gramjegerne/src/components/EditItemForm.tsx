"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

interface EditItemFormProps {
  item: {
    _id: string;
    name: string;
    slug: string;
    image?: {
      asset: {
        _ref: string;
        url?: string;
      };
    };
    category?: { _id: string; title: string };
    size?: string;
    weight?: { weight: number; unit: string };
    quantity?: number;
    calories?: number;
  };
  onSuccess: () => void;
}

const EditItemForm: React.FC<EditItemFormProps> = ({ item, onSuccess }) => {
  const [name, setName] = useState<string>(item.name);
  const [slug, setSlug] = useState<string>(item.slug);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    item.image?.asset.url || null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    item.category?._id || "",
  );
  const [size, setSize] = useState<string>(item.size || "");
  const [weight, setWeight] = useState<{ weight: number; unit: string }>({
    weight: item.weight?.weight || 0,
    unit: item.weight?.unit || "g",
  });
  const [calories, setCalories] = useState<number>(item.calories || 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/getCategories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data: Category[] = await response.json();

        // Sort categories alphabetically
        const sortedCategories = [...data].sort((a, b) =>
          a.title.localeCompare(b.title, "nb"),
        );

        setCategories(sortedCategories);

        // If no category is selected and we have categories, select the first one
        if (selectedCategory.length === 0 && sortedCategories.length > 0) {
          setSelectedCategory(sortedCategories[0]._id);
        }
      } catch (error) {
        console.error("Category fetch error:", error);
        setErrorMessage("Kunne ikke hente kategorier.");
      }
    };
    fetchCategories();
  }, [selectedCategory.length]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImage(file || null);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else if (item.image?.asset.url) {
      setImagePreview(item.image.asset.url);
    } else {
      setImagePreview(null);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !slug) {
      setErrorMessage("Navn og slug er obligatorisk.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("itemId", item._id);
    if (image) {
      formData.append("image", image);
    }

    formData.append("category", selectedCategory);
    if (size.trim()) {
      formData.append("size", size);
    }

    if (weight.weight > 0) {
      formData.append("weight.weight", weight.weight.toString());
      formData.append("weight.unit", weight.unit);
    }

    if (calories > 0) {
      formData.append("calories", calories.toString());
    }

    try {
      const response = await fetch(`/api/items/${item._id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error("Kunne ikke oppdatere utstyr.");
        }
        throw new Error(errorData.message || "Kunne ikke oppdatere utstyr.");
      }

      const updatedItem = await response.json();
      console.log("Utstyr oppdatert:", updatedItem);
      setSuccessMessage("Utstyr oppdatert suksessfullt!");
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Detailed error message:", error.message);
        setErrorMessage(error.message || "Kunne ikke oppdatere utstyr.");
      } else {
        console.error("Unexpected error:", error);
        setErrorMessage("Kunne ikke oppdatere utstyr.");
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return (
    <div>
      {successMessage && (
        <div className="toast text-lg bg-green-100 text-green-800 p-4 rounded-md mb-4">
          {successMessage}
        </div>
      )}
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
          {(imagePreview || item.image) && (
            <div className="mt-4 relative">
              <Image
                src={imagePreview || item.image?.asset?.url || ""}
                alt={`Forhåndsvisning av ${name}`}
                width={96}
                height={96}
                className="h-24 w-24 object-cover rounded-md"
              />
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
              onChange={(e) => setCalories(parseInt(e.target.value, 10) || 0)}
              placeholder="Skriv inn kalorier"
              min="0"
            />
          </label>
        </div>

        {/* Submit Button */}
        <button
          className="button-primary-accent py-2 px-4 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Oppdaterer..." : "Oppdater Utstyr"}
        </button>
      </form>
    </div>
  );
};

export default EditItemForm;
