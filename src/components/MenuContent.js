"use client";
import React from "react";
import MenuCategoriesSection from "./MenuCategoriesSection";
import MenuItemsSection from "./MenuItemsSection";

export default function MenuContent({ categories, items, selectedCategory }) {
  return (
    <div>
      <MenuCategoriesSection
        categories={categories}
        selectedCategory={selectedCategory}
      />
      <MenuItemsSection items={items} selectedCategory={selectedCategory} />
    </div>
  );
}
