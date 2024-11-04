// src/app/components/CategorySelector.tsx
"use client"; // This makes this component a Client Component

import React from "react";
import CategoryButtonsList from "./CategoryButtonList";

interface Category {
  _id: string;
  title: string; // Ensure this matches your data structure
}

interface CategorySelectorProps {
  categories: Category[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories }) => {
  const handleCategorySelect = (categoryTitle: string) => {
    console.log(`Selected category: ${categoryTitle}`);
    // Additional logic for category selection can go here
  };

  return (
    <CategoryButtonsList
      categories={categories}
      onCategorySelect={handleCategorySelect}
    />
  );
};

export default CategorySelector;
