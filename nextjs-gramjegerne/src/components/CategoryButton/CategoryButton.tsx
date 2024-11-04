// src/app/components/CategoryButton.tsx
"use client";

import React from "react";

interface CategoryButtonProps {
  label: string;
  onClick: () => void;
  isActive?: boolean; // Optional: to show the button as "active" when selected
  title?: string; // Optional: add title if needed in the component
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  label,
  onClick,
  isActive,
  title, // Include title here if you'll use it in the component
}) => {
  return (
    <button
      onClick={onClick}
      title={title} // This will set `title` as an HTML tooltip
      className={`menu-item text-lg p-2 px-4 rounded-md font-medium ${
        isActive ? "menu-active" : "menu-item"
      } hover:menu-item:hover`}
    >
      {label}
    </button>
  );
};

export default CategoryButton;
