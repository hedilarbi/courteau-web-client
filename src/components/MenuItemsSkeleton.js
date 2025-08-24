// components/CirclesSkeleton.jsx
"use client";
import React from "react";

export default function MenuItemsSkeleton({
  count = 5,

  className = "",
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3  gap-12  items-center animate-pulse overflow-x-auto `}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`${className} bg-gray-200 dark:bg-gray-400`} />
      ))}
    </div>
  );
}
