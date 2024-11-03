'use client'; // Make sure to add this directive for hooks to work
import React, { useEffect, useState } from 'react';

const NewItemForm = () => {
  const [itemData, setItemData] = useState({
    name: '',
    slug: '',
    size: '',
    weight: { value: '', unit: 'g' }, // Default weight unit
    quantity: '',
    calories: '',
    image: null, // Initialize image as null
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/getCategories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'weightValue') {
      setItemData((prev) => ({
        ...prev,
        weight: { ...prev.weight, value: parseFloat(value) },
      }));
    } else {
      setItemData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWeightUnitChange = (e) => {
    setItemData((prev) => ({
      ...prev,
      weight: { ...prev.weight, unit: e.target.value },
    }));
  };

  const handleImageChange = (e) => {
    setItemData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the form data
    const formData = new FormData();
    formData.append('_type', 'item');
    formData.append('name', itemData.name);
    formData.append('slug', JSON.stringify({ _type: 'slug', current: itemData.slug }));
    formData.append('size', itemData.size);
    formData.append('weight', JSON.stringify(itemData.weight));
    formData.append('quantity', itemData.quantity);
    formData.append('calories', itemData.calories);
    formData.append('image', itemData.image); // Add the image file

    // Add categories
    if (selectedCategory) {
      formData.append('categories', JSON.stringify([{ _type: 'reference', _ref: selectedCategory }]));
    }

    try {
      const response = await fetch('/api/createItem', {
        method: 'POST',
        body: formData, // Send form data directly
      });

      if (!response.ok) throw new Error('Failed to create item');
      const result = await response.json();
      console.log('Item created successfully:', result);
      // Optionally reset form state here
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={itemData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Slug:</label>
        <input
          type="text"
          name="slug"
          value={itemData.slug}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Size:</label>
        <input
          type="text"
          name="size"
          value={itemData.size}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Weight:</label>
        <input
          type="number"
          name="weightValue"
          value={itemData.weight.value}
          onChange={handleChange}
          required
        />
        <select value={itemData.weight.unit} onChange={handleWeightUnitChange}>
          <option value="g">g</option>
          <option value="kg">kg</option>
        </select>
      </div>
      <div>
        <label>Quantity:</label>
        <input
          type="number"
          name="quantity"
          value={itemData.quantity}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Calories:</label>
        <input
          type="number"
          name="calories"
          value={itemData.calories}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
      </div>
      <div>
        <label>Category:</label>
        <select onChange={(e) => setSelectedCategory(e.target.value)} value={selectedCategory}>
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.title}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">Create Item</button>
    </form>
  );
};

export default NewItemForm;
