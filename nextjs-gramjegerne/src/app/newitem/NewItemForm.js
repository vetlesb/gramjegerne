'use client';
import React, { useState, useEffect } from 'react';

const NewItemForm = () => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [size, setSize] = useState('');
  const [weight, setWeight] = useState({ weight: '', unit: 'g' });
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch categories from the API
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

  // Automatically generate slug when name changes
  useEffect(() => {
    if (name) {
      const generatedSlug = name.toLowerCase().replace(/\s+/g, '-').slice(0, 200);
      setSlug(generatedSlug);
    } else {
      setSlug('');
    }
  }, [name]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    if (image) {
      formData.append('image', image);
    }
    
    // Adding selected categories
    selectedCategories.forEach(categoryId => formData.append('categories', categoryId));

    formData.append('size', size);
    formData.append('weight.weight', weight.weight); // Separate weight field
    formData.append('weight.unit', weight.unit);     // Separate unit field
    formData.append('quantity', quantity);
    formData.append('calories', calories);

    const response = await fetch('/api/createItem', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to create item');
    const result = await response.json();
    console.log('Item created successfully:', result);

    // Show success message and reset form fields
    setSuccessMessage('Item created successfully!');
    setName('');
    setSlug('');
    setImage(null);
    setSelectedCategories([]);
    setSize('');
    setWeight({ weight: '', unit: 'g' });
    setQuantity('');
    setCalories('');

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <main className="container mx-auto min-h-screen p-16">
      {successMessage && (
        <div className="p-4 mb-4 text-green-800 bg-green-100 rounded">
          {successMessage}
        </div>
      )}
      <form className="form" onSubmit={handleSubmit}>
        <div className="flex flex-col p-8 gap-y-8">
          <div className="flex flex-col">
            <label className="flex flex-col gap-y-4">
              Name:
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-y-4">
              Slug:
              <input type="text" value={slug} readOnly />
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-y-4">
              Image:
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-y-4">
              Categories:
              <select 
                className="appearance-none" 
                value={selectedCategories} 
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
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-y-4">
              Size:
              <input type="text" value={size} onChange={(e) => setSize(e.target.value)} />
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-y-4">
              Weight:
              <input 
                type="number" 
                value={weight.weight} 
                onChange={(e) => setWeight({ ...weight, weight: e.target.value })} 
              />
              <select value={weight.unit} onChange={(e) => setWeight({ ...weight, unit: e.target.value })}>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-y-4">
              Quantity:
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-y-4">
              Calories:
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </label>
          </div>
          <button className="button-primary" type="submit">Create Item</button>
        </div>
      </form>
    </main>
  );
};

export default NewItemForm;
