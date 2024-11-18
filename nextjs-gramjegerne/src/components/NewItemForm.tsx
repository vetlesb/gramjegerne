// src/components/NewItemForm.tsx

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Command } from "cmdk";
import Icon from "@/components/Icon";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; // Add this import

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
  const [categoryInput, setCategoryInput] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  // Filter categories based on input
  const filteredCategories = categories.filter((category) =>
    category.title.toLowerCase().includes(categoryInput.toLowerCase()),
  );

  // Handle new category creation
  const handleAddCategory = async (newCategoryName: string) => {
    setIsAddingCategory(true);
    try {
      const response = await fetch("/api/addCategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newCategoryName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add category");
      }

      const newCategory = await response.json();
      setCategories((prev) =>
        [...prev, newCategory].sort((a, b) =>
          a.title.localeCompare(b.title, "nb"),
        ),
      );
      setSelectedCategory(newCategory._id);
      setCategoryInput(newCategory.title);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to add category",
      );
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      // Required fields
      formData.append("name", name.trim());
      formData.append("slug", JSON.stringify({ current: slug }));
      formData.append("category", selectedCategory); // Make sure category is always sent

      // Optional fields with validation
      if (image) {
        formData.append("image", image);
      }

      if (size && size.trim()) {
        formData.append("size", size.trim());
      }

      // Weight handling
      if (weight.weight > 0) {
        formData.append(
          "weight",
          JSON.stringify({
            weight: weight.weight,
            unit: weight.unit,
          }),
        );
      }

      if (calories > 0) {
        formData.append("calories", calories.toString());
      } else {
        // Don't append calories at all if it's 0 or less
        console.log("Skipping calories as it's 0 or less");
      }

      // Debug log
      console.log("Sending form data:", {
        name: name.trim(),
        slug,
        category: selectedCategory,
        size: size.trim(),
        weight: weight.weight > 0 ? weight : null,
        calories: calories > 0 ? calories : null,
      });

      const response = await fetch("/api/createItem", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create item");
      }

      const result = await response.json();

      // Reset form
      setName("");
      setSlug("");
      setImage(null);
      setImagePreview(null);
      setSelectedCategory(categories[0]?._id || "");
      setSize("");
      setWeight({ weight: 0, unit: "g" });
      setCalories(0);

      setSuccessMessage("Utstyr opprettet!");

      // Call onSuccess callback with the result
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Error creating item:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not create item. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect near your other effects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const commandRoot = document.querySelector("[cmdk-root]");
      const isCommandInput = target.closest("[cmdk-input]");

      if (commandRoot && !commandRoot.contains(target) && !isCommandInput) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
            Navn *
            <input
              className="w-full max-w-full p-4"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
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

        {/* Category field */}
        <div>
          <label className="flex flex-col gap-y-2">
            Kategori *
            <div className="relative w-full">
              <Command
                className="relative"
                shouldFilter={false}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
              >
                <div className="relative">
                  <Command.Input
                    value={categoryInput}
                    onValueChange={(value) => {
                      setCategoryInput(value);
                      setIsOpen(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(!isOpen);
                    }}
                    readOnly={!isOpen}
                    placeholder="Velg eller søk etter kategori..."
                    className="w-full p-4 border border-gray-300 rounded cursor-pointer"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {selectedCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory("");
                          setCategoryInput("");
                        }}
                        className="p-1 rounded-md"
                        title="Fjern valgt kategori"
                      >
                        <Icon name="close" width={16} height={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                            className="flex items-center gap-2 mt-2 text-accent"
                          >
                            <Icon name="add" width={16} height={16} />
                            Opprett &ldquo;{categoryInput}&rdquo;
                            {isAddingCategory && <LoadingSpinner size="sm" />}
                          </button>
                        )}
                      </Command.Empty>

                      {filteredCategories.map((category) => (
                        <Command.Item
                          key={category._id}
                          value={category._id}
                          onSelect={() => {
                            setSelectedCategory(category._id);
                            setCategoryInput(category.title);
                            setIsOpen(false);
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

        {/* Weight field - make sure it's properly validated */}
        <div className="flex flex-col">
          <label className="flex flex-col gap-y-2">
            Vekt *
            <div className="flex flex-row gap-x-2">
              <input
                type="number"
                className="w-full max-w-full p-4"
                value={weight.weight}
                onChange={(e) =>
                  setWeight({
                    ...weight,
                    weight: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="Vekt"
                min="0"
                step="0.1"
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
