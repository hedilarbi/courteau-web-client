"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

const money = (value) =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: Number(value) % 1 ? 2 : 0,
  }).format(Number(value) || 0);

export default function HeroCarousel({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const price = currentItem.prices?.length > 0 ? currentItem.prices[0].price : currentItem.price;

  return (
    <>
      <div className="relative aspect-[1.2] overflow-hidden rounded-[1.25rem] bg-[#f3ede2]">
        {items.map((item, index) => (
          <Image
            key={item._id || index}
            src={item.image}
            alt={item.name}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 45vw"
            className={`object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      <div className="absolute -bottom-5 -left-3 rounded-xl bg-white px-5 py-3 shadow-xl md:-left-6 z-10 min-w-[200px]">
        <p className="text-[10px] tracking-[.14em] text-[#8a8175]">PROMO DU MOMENT</p>
        <div className="relative h-8 mt-1 overflow-hidden">
          {items.map((item, index) => {
            const itemPrice = item.prices?.length > 0 ? item.prices[0].price : item.price;
            return (
              <p
                key={item._id || index}
                className={`absolute inset-0 font-bebas-neue text-2xl whitespace-nowrap transition-all duration-700 ease-in-out ${
                  index === currentIndex
                    ? "opacity-100 translate-y-0"
                    : index < currentIndex
                    ? "opacity-0 -translate-y-4"
                    : "opacity-0 translate-y-4"
                }`}
              >
                {item.name}
                {itemPrice != null ? ` · ${money(itemPrice)}` : ""}
              </p>
            );
          })}
        </div>
      </div>
    </>
  );
}
