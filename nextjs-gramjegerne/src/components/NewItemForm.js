"use client";
import React, { useState, useEffect } from "react";

const NewItemForm = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [size, setSize] = useState("");
  const [weight, setWeight] = useState({ weight: "", unit: "g" });
  const [quantity, setQuantity] = useState("");
  const [calories, setCalories] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/getCategories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    // Generate a preview URL
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    } else {
      setImagePreview(null); // Clear preview if no file is selected
    }
  };

  const handleImageClick = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    if (image) {
      formData.append("image", image);
    }

    // Adding selected categories
    selectedCategories.forEach((categoryId) =>
      formData.append("categories", categoryId),
    );

    formData.append("size", size);
    formData.append("weight.weight", weight.weight); // Separate weight field
    formData.append("weight.unit", weight.unit); // Separate unit field
    formData.append("quantity", quantity);
    formData.append("calories", calories);

    const response = await fetch("/api/createItem", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to create item");
    const result = await response.json();
    console.log("Item created successfully:", result);

    // Show success message and reset form fields
    setSuccessMessage("Item created successfully!");
    setName("");
    setSlug("");
    setImage(null);
    setImagePreview(null);
    setSelectedCategories([]);
    setSize("");
    setWeight({ weight: "", unit: "g" });
    setQuantity("");
    setCalories("");

    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <main>
      {successMessage && (
        <div className="toast text-lg">
          <div>{successMessage}</div>
        </div>
      )}
      <div className="gap-y-4">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col">
              <label className="flex flex-col gap-y-2">
                Navn
                <input
                  className="w-full max-w-full p-4"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            </div>

            <div>
              <label className="flex flex-col gap-y-2">
                Bilde
                <input
                  type="file"
                  className="w-full max-w-full p-4"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Image preview"
                    className="mt-4 w-24 h-24 object-cover rounded-md cursor-pointer"
                    onClick={handleImageClick}
                    title="Click to remove image"
                  />
                )}
              </label>
            </div>
            <div>
              <label className="flex flex-col gap-y-2">
                Kategori
                <select
                  className="w-full max-w-full p-4"
                  value={selectedCategories}
                  multiple={false}
                  onChange={(e) => {
                    const options = e.target.options;
                    const values = [];
                    for (let i = 0; i < options.length; i++) {
                      if (options[i].selected) {
                        values.push(options[i].value);
                      }
                    }
                    setSelectedCategories(values);
                  }}
                >
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-col gap-y-4">
              <label className="flex flex-col gap-y-2">
                Størrelse
                <input
                  type="text"
                  className="w-full max-w-full p-4"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-col gap-y-4">
              <label className="flex flex-col gap-y-2">
                Vekt
                <div className="flex flex-row gap-x-2">
                  <input
                    type="number"
                    className="w-full max-w-full p-4"
                    value={weight.weight}
                    onChange={(e) =>
                      setWeight({ ...weight, weight: e.target.value })
                    }
                  />
                  <select
                    className="w-full max-w-full p-4"
                    value={weight.unit}
                    onChange={(e) =>
                      setWeight({ ...weight, unit: e.target.value })
                    }
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </label>
            </div>

            <div>
              <label className="flex flex-col gap-y-2">
                Kalorier
                <input
                  type="number"
                  className="w-full max-w-full p-4"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </label>
            </div>
            <button className="button-primary-accent" type="submit">
              Legg til
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default NewItemForm;
