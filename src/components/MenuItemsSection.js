import React from "react";
import Image from "next/image";

import Link from "next/link";
import SelectMenuItemButton from "./SelectMenuItemButton";
import LikeButton from "./LikeButton";

export default function MenuItemsSection({ items, selectedCategory }) {
  if (selectedCategory === "recompenses")
    return (
      <div className="md:px-24 px-6 pt-8 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white shadow-md rounded-2xl relative flex flex-col h-full"
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl">
                <Image
                  src={item.item.image}
                  alt={item.item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4 flex flex-col grow">
                <h3 className="text-xs sm:text-base md:text-lg font-semibold font-inter">
                  {item.item.name}
                </h3>

                <p className="font-inter text-[#717171] md:text-lg sm:text-base text-xs font-medium mt-2">
                  {item.points} pts
                </p>
                <div className="mt-auto pt-3">
                  <SelectMenuItemButton
                    itemId={item._id}
                    selectedCategory={selectedCategory}
                    reward={item}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  if (selectedCategory === "offres") {
    return (
      <div className="md:px-24 px-6 pt-8 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white shadow-md rounded-2xl relative flex flex-col h-full"
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4 flex flex-col grow">
                <Link href={`/menu/offres/${item.slug}`} className="block">
                  <h3 className="text-xs sm:text-base md:text-lg font-semibold font-inter">
                    {item.name}
                  </h3>
                </Link>
                <p className="font-inter text-[#717171] md:text-lg sm:text-base text-xs font-medium mt-2">
                  ${item.price.toFixed(2)}
                </p>
                <div className="mt-auto pt-3">
                  <SelectMenuItemButton
                    itemId={item._id}
                    selectedCategory={selectedCategory}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="md:px-24 px-6 pt-8 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <div
            key={item._id}
            className="bg-white shadow-md rounded-2xl relative flex flex-col h-full"
          >
            <LikeButton itemId={item._id} />
            <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
              <div className="bg-black/30 absolute inset-0 rounded-t-2xl" />
            </div>
            <div className="p-4 flex flex-col grow">
              <Link href={`/menu/articles/${item.slug}`} className="block">
                <h3 className="text-xs sm:text-base md:text-lg font-semibold font-inter">
                  {item.name}
                </h3>
              </Link>
              <p className="font-inter text-[#717171] md:text-lg sm:text-base text-xs font-medium mt-2">
                À partir de : ${item.prices?.[0]?.price.toFixed(2)}
              </p>
              <div className="mt-auto pt-3">
                <SelectMenuItemButton
                  itemId={item._id}
                  selectedCategory={selectedCategory}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
