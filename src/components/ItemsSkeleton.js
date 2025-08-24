// components/CirclesSkeleton.jsx
"use client";
import React from "react";

export default function ItemsSkeleton({
  count = 5,

  gap = 8, // px
  className = "",
}) {
  return (
    <div
      className={`flex items-center animate-pulse overflow-x-auto `}
      style={{ gap }}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`${className} bg-gray-200 dark:bg-gray-400`} />
      ))}
    </div>
  );
}
