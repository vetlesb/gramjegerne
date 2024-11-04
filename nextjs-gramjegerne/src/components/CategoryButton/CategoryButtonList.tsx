// src/app/components/CategoryButtonsList.tsx
"use client";

import React from "react";
import CategoryButton from "./CategoryButton";

// Update the Category interface to include the title
interface Category {
  _id: string;
  title: string; // Use title instead of name
}

interface CategoryButtonsListProps {
  categories: Category[];
  onCategorySelect: (categoryTitle: string) => void; // Update parameter name to reflect title usage
}

const CategoryButtonsList: React.FC<CategoryButtonsListProps> = ({
  categories,
  onCategorySelect,
}) => {
  return (
    <div className="flex flex-nowrap overflow-scroll no-scrollbar items-center gap-x-4 gap-y-4 pb-8">
      {categories.map((category) => (
        <CategoryButton
          key={category._id}
          label={category.title} // Use category.title for the button label
          onClick={() => onCategorySelect(category.title)} // Use category.title for the click event
        />
      ))}
    </div>
  );
};

export default CategoryButtonsList;
